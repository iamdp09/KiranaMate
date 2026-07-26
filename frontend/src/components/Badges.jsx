export function StockBadge({ status, stock }) {
  const config = {
    in_stock: { cls: 'badge-success', label: '● In Stock', dot: '#22C55E' },
    low: { cls: 'badge-warning', label: '● Low Stock', dot: '#F59E0B' },
    out_of_stock: { cls: 'badge-danger', label: '● Out of Stock', dot: '#EF4444' },
  };
  const { cls, label } = config[status] || config['in_stock'];
  return (
    <span className={`badge ${cls}`}>
      {label} {stock !== undefined && `(${stock})`}
    </span>
  );
}

export function OrderStatusBadge({ status }) {
  const map = {
    Pending: 'badge-warning',
    Confirmed: 'badge-info',
    Delivered: 'badge-success',
    Rejected: 'badge-danger',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export function ModelBadge({ model }) {
  const map = {
    polynomial_regression: { label: 'Polynomial Regression', cls: 'badge-purple' },
    linear_regression: { label: 'Linear Regression', cls: 'badge-info' },
    moving_average: { label: 'Moving Average', cls: 'badge-gray' },
    no_data: { label: 'No Data', cls: 'badge-danger' },
  };
  const { label, cls } = map[model] || { label: model, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}
