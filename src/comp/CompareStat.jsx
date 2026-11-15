function getStats(rows) {
  const values = rows.map((row) => row.value);

  return {
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1],
  };
}

export { getStats };
