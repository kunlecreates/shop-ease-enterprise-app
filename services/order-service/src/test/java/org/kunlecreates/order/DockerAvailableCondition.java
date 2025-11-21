package org.kunlecreates.order;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.testcontainers.DockerClientFactory;

/**
 * JUnit condition that disables tests if Docker is not available.
 * Evaluated before extensions like TestcontainersExtension are started.
 */
public class DockerAvailableCondition implements ExecutionCondition {

    @Override
    public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
        boolean available = false;
        try {
            available = DockerClientFactory.instance().isDockerAvailable();
        } catch (Throwable t) {
            available = false;
        }

        if (available) {
            return ConditionEvaluationResult.enabled("Docker is available");
        }
        return ConditionEvaluationResult.disabled("Docker is not available; skipping containerized tests");
    }
}
