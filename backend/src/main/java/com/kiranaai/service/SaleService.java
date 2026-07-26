package com.kiranaai.service;

import com.kiranaai.dto.request.CreateSaleRequest;
import com.kiranaai.dto.response.PagedResponse;
import com.kiranaai.dto.response.SaleResponse;
import com.kiranaai.exception.BadRequestException;
import com.kiranaai.exception.ResourceNotFoundException;
import com.kiranaai.model.*;
import com.kiranaai.repository.InventoryLogRepository;
import com.kiranaai.repository.ProductRepository;
import com.kiranaai.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final InventoryLogRepository inventoryLogRepository;

    public PagedResponse<SaleResponse> getAllSales(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("saleDate").descending());
        return PagedResponse.of(saleRepository.findByUserIdOrderBySaleDateDesc(userId, pageable)
                .map(this::toResponse));
    }

    public SaleResponse recordSale(String userId, CreateSaleRequest req) {
        Product product = productRepository.findByIdAndUserId(req.productId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", req.productId()));

        if (product.getCurrentStock() < req.quantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getCurrentStock()
                    + ", Requested: " + req.quantity());
        }

        // Deduct stock
        int before = product.getCurrentStock();
        product.setCurrentStock(before - req.quantity());
        productRepository.save(product);

        // Record sale
        SaleSource source = SaleSource.MANUAL;
        if ("WHATSAPP".equalsIgnoreCase(req.source())) source = SaleSource.WHATSAPP;

        Sale sale = Sale.builder()
                .userId(userId)
                .productId(product.getId())
                .productName(product.getName())
                .quantity(req.quantity())
                .unit(product.getUnit())
                .sellingPrice(product.getSellingPrice())
                .totalAmount(product.getSellingPrice() * req.quantity())
                .saleDate(Instant.now())
                .source(source)
                .build();
        sale = saleRepository.save(sale);

        // Log inventory change
        InventoryLog invLog = InventoryLog.builder()
                .userId(userId)
                .productId(product.getId())
                .changeType(InventoryChangeType.SALE)
                .quantityBefore(before)
                .quantityChange(-req.quantity())
                .quantityAfter(product.getCurrentStock())
                .note("Sale recorded — " + req.quantity() + " " + product.getUnit() + " of " + product.getName())
                .build();
        inventoryLogRepository.save(invLog);

        log.info("Sale recorded: {} x {} for user: {}", req.quantity(), product.getName(), userId);
        return toResponse(sale);
    }

    public SaleResponse getSaleById(String userId, String id) {
        return saleRepository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .map(this::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
    }

    public void deleteSale(String userId, String id) {
        Sale sale = saleRepository.findById(id)
                .filter(s -> s.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));

        // Restore stock
        productRepository.findById(sale.getProductId()).ifPresent(product -> {
            int before = product.getCurrentStock();
            product.setCurrentStock(before + sale.getQuantity());
            productRepository.save(product);

            InventoryLog restoreLog = InventoryLog.builder()
                    .userId(userId).productId(product.getId())
                    .changeType(InventoryChangeType.MANUAL_ADJUST)
                    .quantityBefore(before).quantityChange(sale.getQuantity())
                    .quantityAfter(product.getCurrentStock())
                    .note("Sale deleted — stock restored").build();
            inventoryLogRepository.save(restoreLog);
        });

        saleRepository.delete(sale);
    }

    public List<SaleResponse> getSalesByProduct(String userId, String productId) {
        return saleRepository.findByUserIdAndProductIdOrderBySaleDateDesc(userId, productId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public Map<String, Object> getSalesSummary(String userId, Instant from, Instant to) {
        List<Sale> sales = saleRepository.findByUserIdAndSaleDateBetweenOrderBySaleDateDesc(userId, from, to);
        double totalRevenue = sales.stream().mapToDouble(Sale::getTotalAmount).sum();
        long totalCount = sales.size();

        Map<String, Object> summary = new HashMap<>();
        summary.put("from", from);
        summary.put("to", to);
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalSales", totalCount);
        summary.put("averagePerSale", totalCount > 0 ? totalRevenue / totalCount : 0);
        return summary;
    }

    SaleResponse toResponse(Sale s) {
        return SaleResponse.builder()
                .id(s.getId()).userId(s.getUserId()).productId(s.getProductId())
                .productName(s.getProductName()).quantity(s.getQuantity()).unit(s.getUnit())
                .sellingPrice(s.getSellingPrice()).totalAmount(s.getTotalAmount())
                .saleDate(s.getSaleDate())
                .source(s.getSource() != null ? s.getSource().name() : "MANUAL")
                .createdAt(s.getCreatedAt())
                .build();
    }

}
