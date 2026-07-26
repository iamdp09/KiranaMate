package com.kiranaai.repository;

import com.kiranaai.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {

    List<Product> findByUserIdAndIsActiveTrue(String userId);

    Page<Product> findByUserIdAndIsActiveTrue(String userId, Pageable pageable);

    Page<Product> findByUserIdAndIsActiveTrueAndNameContainingIgnoreCase(
            String userId, String name, Pageable pageable);

    /**
     * Returns all active products for the given user whose currentStock
     * is at or below their individual reorderThreshold.
     */
    @Query("{ 'userId': ?0, 'isActive': true, $expr: { $lte: ['$currentStock', '$reorderThreshold'] } }")
    List<Product> findLowStockByUserId(String userId);

    List<Product> findByUserIdAndIsActiveTrueAndCategory(String userId, String category);

    Optional<Product> findByIdAndUserId(String id, String userId);

    Optional<Product> findByNameIgnoreCaseAndUserIdAndIsActiveTrue(String name, String userId);

    long countByUserIdAndIsActiveTrue(String userId);
}
