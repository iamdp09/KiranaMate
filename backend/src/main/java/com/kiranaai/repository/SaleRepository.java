package com.kiranaai.repository;

import com.kiranaai.model.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SaleRepository extends MongoRepository<Sale, String> {

    Page<Sale> findByUserIdOrderBySaleDateDesc(String userId, Pageable pageable);

    List<Sale> findByUserIdAndSaleDateBetweenOrderBySaleDateDesc(
            String userId, Instant from, Instant to);

    List<Sale> findByUserIdAndProductIdOrderBySaleDateDesc(String userId, String productId);

    List<Sale> findTop10ByUserIdOrderBySaleDateDesc(String userId);

    List<Sale> findByUserIdAndSaleDateAfterOrderBySaleDateDesc(String userId, Instant after);
}
