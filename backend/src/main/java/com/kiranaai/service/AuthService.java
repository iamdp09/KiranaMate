package com.kiranaai.service;

import com.kiranaai.dto.request.*;
import com.kiranaai.dto.response.*;
import com.kiranaai.exception.BadRequestException;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.exception.UnauthorizedException;
import com.kiranaai.model.OtpRecord;
import com.kiranaai.model.User;
import com.kiranaai.model.UserRole;
import com.kiranaai.repository.OtpRepository;
import com.kiranaai.repository.UserRepository;
import com.kiranaai.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final WhatsAppService whatsAppService;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new BadRequestException("Email already registered: " + req.email());
        }
        if (userRepository.existsByPhone(req.phone())) {
            throw new BadRequestException("Phone already registered: " + req.phone());
        }

        User user = User.builder()
                .name(req.name())
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .phone(req.phone())
                .storeName(req.storeName())
                .storeAddress(req.storeAddress())
                .role(UserRole.OWNER)
                .isActive(true)
                .whatsappVerified(false)
                .build();

        user = userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is deactivated");
        }

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.isTokenValid(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String userId = jwtTokenProvider.extractUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    public void sendWhatsAppOtp(String phone) {
        String otp = otpService.generateAndSaveOtp(phone);

        String message = "🔐 *KiranaAI Login OTP*\n\n"
                       + "Your OTP is: *" + otp + "*\n"
                       + "Valid for 5 minutes. Do not share this with anyone.";

        // Ensure phone has + prefix for Twilio
        String toPhone = phone.startsWith("+") ? phone : "+" + phone;
        whatsAppService.sendMessage(toPhone, message);

        log.info("[OTP] Sent OTP to phone {}", phone);
    }

    public AuthResponse verifyWhatsAppOtp(VerifyOtpRequest req) {
        boolean valid = otpService.verifyOtp(req.phone(), req.otp());
        if (!valid) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        // ── Find existing user by flexible phone matching ───────────────────
        // User may have registered as 9876543210 but OTP was sent to +919876543210
        User user = findUserByFlexiblePhone(req.phone()).orElseGet(() -> {
            // No existing user found — create a new WhatsApp-only account
            log.info("No existing user found for phone {}, creating new account", req.phone());
            User newUser = User.builder()
                    .phone(req.phone())
                    .name("Kirana Owner")
                    .email(req.phone() + "@whatsapp.kiranaai.com")
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .storeName("My Kirana Store")
                    .role(UserRole.OWNER)
                    .isActive(true)
                    .whatsappVerified(true)
                    .build();
            return userRepository.save(newUser);
        });

        // Mark WhatsApp as verified on the found/created user
        user.setWhatsappVerified(true);
        userRepository.save(user);

        log.info("WhatsApp OTP verified for phone: {} → user: {}", req.phone(), user.getEmail());
        return buildAuthResponse(user);
    }

    /**
     * Tries multiple phone number formats to find an existing user.
     * Handles: +919876543210 / 919876543210 / 9876543210 / 09876543210
     */
    private Optional<User> findUserByFlexiblePhone(String phone) {
        // 1. Exact match
        Optional<User> user = userRepository.findByPhone(phone);
        if (user.isPresent()) return user;

        // 2. Without leading +
        if (phone.startsWith("+")) {
            user = userRepository.findByPhone(phone.substring(1));
            if (user.isPresent()) return user;
        }

        // 3. Last 10 digits and common prefixes
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() >= 10) {
            String last10 = digits.substring(digits.length() - 10);

            user = userRepository.findByPhone(last10);
            if (user.isPresent()) return user;

            user = userRepository.findByPhone("+91" + last10);
            if (user.isPresent()) return user;

            user = userRepository.findByPhone("91" + last10);
            if (user.isPresent()) return user;

            user = userRepository.findByPhone("0" + last10);
            if (user.isPresent()) return user;
        }

        return Optional.empty();
    }

    public UserResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return toUserResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(toUserResponse(user))
                .build();
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .storeName(user.getStoreName())
                .storeAddress(user.getStoreAddress())
                .role(user.getRole() != null ? user.getRole().name() : "OWNER")
                .whatsappVerified(user.isWhatsappVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
