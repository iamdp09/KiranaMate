package com.kiranaai.controller;

import com.kiranaai.dto.request.*;
import com.kiranaai.dto.response.ApiResponse;
import com.kiranaai.dto.response.AuthResponse;
import com.kiranaai.dto.response.UserResponse;
import com.kiranaai.service.AuthService;
import com.kiranaai.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Auth endpoints — register, login, WhatsApp OTP")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register new store owner")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Account created successfully", authService.register(req)));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(req)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", authService.refreshToken(req.refreshToken())));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout (client-side token removal)")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/whatsapp/send-otp")
    @Operation(summary = "Send OTP via WhatsApp for phone login")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody WhatsAppOtpRequest req) {
        authService.sendWhatsAppOtp(req.phone());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your WhatsApp number", null));
    }

    @PostMapping("/whatsapp/verify-otp")
    @Operation(summary = "Verify WhatsApp OTP and login")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.verifyWhatsAppOtp(req)));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(ApiResponse.success(authService.getProfile(currentUser.getId())));
    }
}
