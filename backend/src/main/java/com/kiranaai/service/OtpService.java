package com.kiranaai.service;

import com.kiranaai.model.OtpRecord;
import com.kiranaai.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpRepository otpRepository;

    @Value("${app.otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    public String generateAndSaveOtp(String phone) {
        // Delete any existing OTPs for this phone
        otpRepository.deleteByPhone(phone);

        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpRecord record = OtpRecord.builder()
                .phone(phone)
                .otp(otp)
                .used(false)
                .expiresAt(Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES))
                .build();

        otpRepository.save(record);
        log.debug("Generated OTP for phone {}", phone);
        return otp;
    }

    public boolean verifyOtp(String phone, String otp) {
        return otpRepository
                .findByPhoneAndOtpAndUsedFalseAndExpiresAtAfter(phone, otp, Instant.now())
                .map(record -> {
                    record.setUsed(true);
                    otpRepository.save(record);
                    return true;
                })
                .orElse(false);
    }
}
