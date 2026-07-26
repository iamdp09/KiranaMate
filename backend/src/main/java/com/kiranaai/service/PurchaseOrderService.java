package com.kiranaai.service;

import com.kiranaai.dto.request.CreatePurchaseOrderRequest;
import com.kiranaai.dto.response.PagedResponse;
import com.kiranaai.dto.response.PurchaseOrderResponse;
import com.kiranaai.dto.response.PurchaseOrderResponse.PurchaseOrderItemResponse;
import com.kiranaai.exception.BadRequestException;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.model.*;
import com.kiranaai.repository.InventoryLogRepository;
import com.kiranaai.repository.ProductRepository;
import com.kiranaai.repository.PurchaseOrderRepository;
import com.kiranaai.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final SupplierRepository supplierRepository;

    public PagedResponse<PurchaseOrderResponse> getAllOrders(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.of(purchaseOrderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse));
    }

    public PurchaseOrderResponse createOrder(String userId, CreatePurchaseOrderRequest req) {
        String supplierName = supplierRepository.findByIdAndUserId(req.getSupplierId(), userId)
                .map(Supplier::getName)
                .orElse("Unknown Supplier");

        List<PurchaseOrder.PurchaseOrderItem> items = req.getItems().stream()
                .map(i -> {
                    String productName = productRepository.findById(i.productId())
                            .map(Product::getName).orElse("Unknown Product");
                    return PurchaseOrder.PurchaseOrderItem.builder()
                            .productId(i.productId())
                            .productName(productName)
                            .quantityOrdered(i.quantityOrdered())
                            .costPrice(i.costPrice())
                            .quantityReceived(0)
                            .build();
                })
                .collect(Collectors.toList());

        double totalAmount = items.stream()
                .mapToDouble(i -> i.getQuantityOrdered() * i.getCostPrice())
                .sum();

        PurchaseOrder order = PurchaseOrder.builder()
                .userId(userId)
                .supplierId(req.getSupplierId())
                .supplierName(supplierName)
                .items(items)
                .totalAmount(totalAmount)
                .status(PurchaseOrderStatus.PENDING)
                .orderedAt(Instant.now())
                .build();

        order = purchaseOrderRepository.save(order);
        log.info("Purchase order created for user: {}", userId);
        return toResponse(order);
    }

    public PurchaseOrderResponse getOrderById(String userId, String id) {
        return purchaseOrderRepository.findByIdAndUserId(id, userId)
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));
    }

    public PurchaseOrderResponse markDelivered(String userId, String id) {
        PurchaseOrder order = purchaseOrderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new BadRequestException("Cannot deliver a cancelled order");
        }

        // Update stock for each item
        final String orderId = order.getId();
        for (PurchaseOrder.PurchaseOrderItem item : order.getItems()) {
            productRepository.findById(item.getProductId()).ifPresent(product -> {
                int before = product.getCurrentStock();
                product.setCurrentStock(before + item.getQuantityOrdered());
                productRepository.save(product);

                item.setQuantityReceived(item.getQuantityOrdered());

                InventoryLog invLog = InventoryLog.builder()
                        .userId(userId).productId(product.getId())
                        .changeType(InventoryChangeType.RESTOCK)
                        .quantityBefore(before).quantityChange(item.getQuantityOrdered())
                        .quantityAfter(product.getCurrentStock())
                        .note("Purchase order delivered: " + orderId)
                        .build();
                inventoryLogRepository.save(invLog);
            });
        }

        order.setStatus(PurchaseOrderStatus.DELIVERED);
        order.setDeliveredAt(Instant.now());
        order = purchaseOrderRepository.save(order);

        log.info("Purchase order {} marked as delivered", id);
        return toResponse(order);
    }

    public PurchaseOrderResponse cancelOrder(String userId, String id) {
        PurchaseOrder order = purchaseOrderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (order.getStatus() == PurchaseOrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel a delivered order");
        }

        order.setStatus(PurchaseOrderStatus.CANCELLED);
        order = purchaseOrderRepository.save(order);
        return toResponse(order);
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder o) {
        List<PurchaseOrderItemResponse> itemResponses = o.getItems() == null ? List.of() :
                o.getItems().stream()
                        .map(i -> PurchaseOrderItemResponse.builder()
                                .productId(i.getProductId()).productName(i.getProductName())
                                .quantityOrdered(i.getQuantityOrdered())
                                .quantityReceived(i.getQuantityReceived())
                                .costPrice(i.getCostPrice()).build())
                        .collect(Collectors.toList());

        return PurchaseOrderResponse.builder()
                .id(o.getId()).userId(o.getUserId()).supplierId(o.getSupplierId())
                .supplierName(o.getSupplierName()).items(itemResponses)
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus() != null ? o.getStatus().name() : "PENDING")
                .orderedAt(o.getOrderedAt()).deliveredAt(o.getDeliveredAt())
                .createdAt(o.getCreatedAt()).build();
    }
}
