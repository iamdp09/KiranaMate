package com.kiranaai.repository;

import com.kiranaai.model.PurchaseOrder;
import com.kiranaai.model.PurchaseOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder, String> {

    Page<PurchaseOrder> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Optional<PurchaseOrder> findByIdAndUserId(String id, String userId);

    List<PurchaseOrder> findByUserIdAndStatus(String userId, PurchaseOrderStatus status);
}
