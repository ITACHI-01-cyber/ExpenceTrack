package com.expensetracker.repository;

import com.expensetracker.model.Otp;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface OtpRepository extends MongoRepository<Otp, String> {
    Optional<Otp> findByEmailAndCodeAndPurpose(String email, String code, Otp.Purpose purpose);
    Optional<Otp> findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, Otp.Purpose purpose);
    void deleteByEmailAndPurpose(String email, Otp.Purpose purpose);
}
