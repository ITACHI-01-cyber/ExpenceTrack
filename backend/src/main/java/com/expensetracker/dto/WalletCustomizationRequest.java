package com.expensetracker.dto;

import java.util.Map;

/**
 * A presence-aware PATCH body. Values may be null to explicitly clear a
 * customization field; absent keys are left unchanged.
 */
public record WalletCustomizationRequest(Map<String, Object> fields) {
    public boolean contains(String name) {
        return fields != null && fields.containsKey(name);
    }

    public Object value(String name) {
        return fields == null ? null : fields.get(name);
    }
}
