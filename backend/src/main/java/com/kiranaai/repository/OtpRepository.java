package com.kiranaai.repository;

import com.kiranaai.model.OtpRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface OtpRepository extends MongoRepository<OtpRecord, String> {

    /**
     * Validates an OTP by matching phone + otp, ensuring it has not been
     * consumed yet, and that its expiry is strictly in the future.
     *
     * @param phone  the user's phone number
     * @param otp    the OTP code to validate
     * @param now    current timestamp — only records with expiresAt after this are returned
     * @return       a matching, unused, non-expired OtpRecord wrapped in Optional
     */
    Optional<OtpRecord> findByPhoneAndOtpAndUsedFalseAndExpiresAtAfter(
            String phone, String otp, Instant now);

    void deleteByPhone(String phone);
}
