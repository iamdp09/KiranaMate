package com.kiranaai.repository;

import com.kiranaai.model.Supplier;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends MongoRepository<Supplier, String> {

    List<Supplier> findByUserIdAndIsActiveTrue(String userId);

    Optional<Supplier> findByIdAndUserId(String id, String userId);
}
