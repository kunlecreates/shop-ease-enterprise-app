// Helpers for propagating trace headers in integration tests
export function otelHeaders(traceId = '00-00000000000000000000000000000000-0000000000000000-01') {
  return {
    'traceparent': traceId,
    'tracestate': 'congo=congosValue'
  };
}
