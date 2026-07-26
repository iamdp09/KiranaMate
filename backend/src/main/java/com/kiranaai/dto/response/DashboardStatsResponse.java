package com.kiranaai.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsResponse {
    private long totalProducts;
    private long totalActiveProducts;
    private long lowStockCount;
    private long todaySalesCount;
    private Double todayRevenue;
    private Double weekRevenue;
    private Double monthRevenue;
    private Double totalInventoryValue;
}
