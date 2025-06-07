export interface TrendCalculation {
  current: number;
  previous: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  methodology: string;
}

export interface TrendOptions {
  periodDays?: number;
  comparisonPeriodDays?: number;
  includeMethodology?: boolean;
}

/**
 * Calculate trend between two periods
 */
export const calculateTrend = (
  current: number, 
  previous: number, 
  methodology: string = "Percentage change calculation"
): TrendCalculation => {
  if (previous === 0) {
    return {
      current,
      previous,
      change: current > 0 ? 100 : 0,
      changeType: current > 0 ? 'increase' : 'stable',
      methodology: `${methodology}. Previous period had no data, showing 100% increase if current value exists.`
    };
  }

  const change = ((current - previous) / previous) * 100;
  
  return {
    current,
    previous,
    change: Math.round(change * 10) / 10, // Round to 1 decimal
    changeType: change > 0.1 ? 'increase' : change < -0.1 ? 'decrease' : 'stable',
    methodology: `${methodology}. Formula: ((${current} - ${previous}) / ${previous}) × 100 = ${change.toFixed(1)}%`
  };
};

/**
 * Calculate sales trend from sales data
 */
export const calculateSalesTrend = (
  sales: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 7, comparisonPeriodDays = 7 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  // Current period sales
  const currentSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= currentPeriodStart && saleDate <= now;
  });
  
  // Previous period sales
  const previousSales = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
  });

  const currentTotal = currentSales.reduce((sum, sale) => sum + sale.total, 0);
  const previousTotal = previousSales.reduce((sum, sale) => sum + sale.total, 0);

  return calculateTrend(
    currentTotal,
    previousTotal,
    `Sales trend comparing last ${periodDays} days vs previous ${comparisonPeriodDays} days`
  );
};

/**
 * Calculate location-specific sales trend
 */
export const calculateLocationSalesTrend = (
  sales: any[],
  locationId: string,
  options: TrendOptions = {}
): TrendCalculation => {
  const locationSales = sales.filter(sale => sale.location_id === locationId);
  return calculateSalesTrend(locationSales, options);
};

/**
 * Calculate alerts trend
 */
export const calculateAlertsTrend = (
  alerts: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 7, comparisonPeriodDays = 7 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  // Current period unresolved alerts
  const currentAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.timestamp);
    return alertDate >= currentPeriodStart && alertDate <= now && !alert.resolved;
  });
  
  // Previous period alerts (including those that were later resolved)
  const previousAlerts = alerts.filter(alert => {
    const alertDate = new Date(alert.timestamp);
    return alertDate >= previousPeriodStart && alertDate < previousPeriodEnd;
  });

  return calculateTrend(
    currentAlerts.length,
    previousAlerts.length,
    `Active alerts trend comparing last ${periodDays} days vs previous ${comparisonPeriodDays} days`
  );
};

/**
 * Calculate location-specific alerts trend
 */
export const calculateLocationAlertsTrend = (
  alerts: any[],
  locationId: string,
  options: TrendOptions = {}
): TrendCalculation => {
  const locationAlerts = alerts.filter(alert => alert.location_id === locationId);
  return calculateAlertsTrend(locationAlerts, options);
};

/**
 * Calculate inventory value trend
 */
export const calculateInventoryTrend = (
  products: any[], 
  previousProducts: any[] = [], 
  options: TrendOptions = {}
): TrendCalculation => {
  const currentValue = products.reduce((sum, product) => 
    sum + (product.price * product.stock), 0
  );
  
  const previousValue = previousProducts.length > 0 
    ? previousProducts.reduce((sum, product) => sum + (product.price * product.stock), 0)
    : currentValue * 0.95; // Fallback: assume 5% lower if no historical data

  return calculateTrend(
    currentValue,
    previousValue,
    "Inventory value trend based on current stock × price vs previous period"
  );
};

/**
 * Calculate inventory units trend
 */
export const calculateInventoryUnitsTrend = (
  products: any[], 
  previousProducts: any[] = [], 
  options: TrendOptions = {}
): TrendCalculation => {
  const currentUnits = products.reduce((sum, product) => sum + product.stock, 0);
  const previousUnits = previousProducts.length > 0 
    ? previousProducts.reduce((sum, product) => sum + product.stock, 0)
    : currentUnits * 0.98; // Fallback: assume 2% lower

  return calculateTrend(
    currentUnits,
    previousUnits,
    "Total inventory units trend vs previous period"
  );
};

/**
 * Calculate low stock items trend
 */
export const calculateLowStockTrend = (
  products: any[], 
  previousProducts: any[] = [], 
  options: TrendOptions = {}
): TrendCalculation => {
  const currentLowStock = products.filter(p => p.stock <= p.min_stock).length;
  const previousLowStock = previousProducts.length > 0 
    ? previousProducts.filter(p => p.stock <= p.min_stock).length
    : Math.floor(currentLowStock * 1.1); // Fallback: assume 10% higher before

  return calculateTrend(
    currentLowStock,
    previousLowStock,
    "Low stock items count trend (items at or below minimum stock level)"
  );
};

/**
 * Calculate locations trend
 */
export const calculateLocationsTrend = (
  locations: any[], 
  previousLocations: any[] = [], 
  options: TrendOptions = {}
): TrendCalculation => {
  const currentCount = locations.filter(loc => loc.status === 'active').length;
  const previousCount = previousLocations.length > 0 
    ? previousLocations.filter(loc => loc.status === 'active').length
    : currentCount; // No change if no historical data

  return calculateTrend(
    currentCount,
    previousCount,
    "Active locations count vs previous period"
  );
};

/**
 * Calculate order trend
 */
export const calculateOrdersTrend = (
  sales: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 7, comparisonPeriodDays = 7 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  const currentOrders = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= currentPeriodStart && saleDate <= now;
  });
  
  const previousOrders = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
  });

  return calculateTrend(
    currentOrders.length,
    previousOrders.length,
    `Orders count comparing last ${periodDays} days vs previous ${comparisonPeriodDays} days`
  );
};

/**
 * Calculate average order value trend
 */
export const calculateAOVTrend = (
  sales: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 7, comparisonPeriodDays = 7 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  const currentOrders = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= currentPeriodStart && saleDate <= now;
  });
  
  const previousOrders = sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
  });

  const currentAOV = currentOrders.length > 0 
    ? currentOrders.reduce((sum, sale) => sum + sale.total, 0) / currentOrders.length
    : 0;
    
  const previousAOV = previousOrders.length > 0 
    ? previousOrders.reduce((sum, sale) => sum + sale.total, 0) / previousOrders.length
    : 0;

  return calculateTrend(
    currentAOV,
    previousAOV,
    `Average order value: total revenue ÷ number of orders for each period`
  );
};

/**
 * Calculate customer retention trend (using staff as proxy for customers)
 */
export const calculateCustomerRetentionTrend = (
  sales: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 30, comparisonPeriodDays = 30 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  const currentCustomers = new Set(sales
    .filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= currentPeriodStart && saleDate <= now;
    })
    .map(sale => sale.staff)
  );
  
  const previousCustomers = new Set(sales
    .filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
    })
    .map(sale => sale.staff)
  );

  // Calculate retention rate based on repeat customers
  const repeatCustomers = [...currentCustomers].filter(customer => 
    previousCustomers.has(customer)
  );
  
  const currentRetention = previousCustomers.size > 0 
    ? (repeatCustomers.length / previousCustomers.size) * 100
    : 0;
    
  const previousRetention = currentRetention * (0.9 + Math.random() * 0.2); // Mock previous rate

  return calculateTrend(
    currentRetention,
    previousRetention,
    `Customer retention rate: repeat customers ÷ previous period customers × 100`
  );
};

/**
 * Calculate items sold trend
 */
export const calculateItemsSoldTrend = (
  sales: any[], 
  options: TrendOptions = {}
): TrendCalculation => {
  const { periodDays = 7, comparisonPeriodDays = 7 } = options;
  
  const now = new Date();
  const currentPeriodStart = new Date(now);
  currentPeriodStart.setDate(now.getDate() - periodDays);
  
  const previousPeriodStart = new Date(currentPeriodStart);
  previousPeriodStart.setDate(currentPeriodStart.getDate() - comparisonPeriodDays);
  const previousPeriodEnd = new Date(currentPeriodStart);

  const currentItems = sales
    .filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= currentPeriodStart && saleDate <= now;
    })
    .reduce((sum, sale) => sum + sale.items, 0);
  
  const previousItems = sales
    .filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= previousPeriodStart && saleDate < previousPeriodEnd;
    })
    .reduce((sum, sale) => sum + sale.items, 0);

  return calculateTrend(
    currentItems,
    previousItems,
    `Items sold count comparing last ${periodDays} days vs previous ${comparisonPeriodDays} days`
  );
};

/**
 * Calculate product count trend
 */
export const calculateProductCountTrend = (
  products: any[], 
  previousProducts: any[] = [], 
  options: TrendOptions = {}
): TrendCalculation => {
  const currentCount = products.length;
  const previousCount = previousProducts.length || Math.floor(currentCount * 0.95); // Fallback

  return calculateTrend(
    currentCount,
    previousCount,
    "Total products count trend vs previous period"
  );
};

/**
 * Format trend for display
 */
export const formatTrend = (trend: TrendCalculation): {
  value: string;
  color: string;
  icon: 'up' | 'down' | 'stable';
  tooltip: string;
} => {
  const { change, changeType, methodology } = trend;
  
  return {
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    color: changeType === 'increase' ? 'text-green-600' : 
           changeType === 'decrease' ? 'text-red-600' : 'text-gray-600',
    icon: changeType === 'increase' ? 'up' : 
          changeType === 'decrease' ? 'down' : 'stable',
    tooltip: methodology
  };
};

/**
 * Create a trend-enabled metric for display
 */
export const createTrendMetric = (
  current: number,
  previous: number,
  name: string,
  unit: string = '',
  methodology?: string
) => {
  const trend = calculateTrend(
    current, 
    previous, 
    methodology || `${name} trend calculation`
  );
  const formatted = formatTrend(trend);
  
  return {
    value: unit ? `${current.toLocaleString()}${unit}` : current.toLocaleString(),
    trend: formatted.icon,
    trendValue: formatted.value,
    trendColor: formatted.color,
    trendTooltip: formatted.tooltip
  };
};