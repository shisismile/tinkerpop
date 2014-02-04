package com.tinkerpop.blueprints.strategy;

import com.tinkerpop.blueprints.Edge;
import com.tinkerpop.blueprints.Element;
import com.tinkerpop.blueprints.Graph;
import com.tinkerpop.blueprints.Property;
import com.tinkerpop.blueprints.Strategy;
import com.tinkerpop.blueprints.Vertex;
import com.tinkerpop.blueprints.query.GraphQuery;
import com.tinkerpop.blueprints.util.function.TriFunction;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;

/**
 * @author Stephen Mallette (http://stephen.genoprime.com)
 */
public class SequenceGraphStrategy implements GraphStrategy {
    private final List<GraphStrategy> graphStrategySequence;

    public SequenceGraphStrategy(final GraphStrategy... strategies) {
        this.graphStrategySequence = new ArrayList<>(Arrays.asList(strategies));
    }

    @Override
    public UnaryOperator<Function<Object[], Vertex>> getAddVertexStrategy(final Strategy.Context<Graph> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getAddVertexStrategy(ctx));
    }

    @Override
    public UnaryOperator<TriFunction<String, Vertex, Object[], Edge>> getAddEdgeStrategy(final Strategy.Context<Vertex> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getAddEdgeStrategy(ctx));
    }

    @Override
    public UnaryOperator<Supplier<Iterable<Vertex>>> getGraphQueryVerticesStrategy(Strategy.Context<GraphQuery> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getGraphQueryVerticesStrategy(ctx));
    }

    @Override
    public UnaryOperator<Function<Object[], GraphQuery>> getGraphQueryIdsStrategy(Strategy.Context<GraphQuery> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getGraphQueryIdsStrategy(ctx));
    }

    @Override
    public UnaryOperator<Supplier<Void>> getRemoveElementStrategy(Strategy.Context<? extends Element> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getRemoveElementStrategy(ctx));
    }

    @Override
    public <V> UnaryOperator<Supplier<Void>> getRemovePropertyStrategy(Strategy.Context<Property<V>> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getRemovePropertyStrategy(ctx));
    }

    @Override
    public <V> UnaryOperator<Function<String, Property<V>>> getElementGetProperty(Strategy.Context<? extends Element> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getElementGetProperty(ctx));
    }

    @Override
    public <V> UnaryOperator<BiConsumer<String, V>> getElementSetProperty(Strategy.Context<? extends Element> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getElementSetProperty(ctx));
    }

    @Override
    public UnaryOperator<BiConsumer<String, Object>> getGraphAnnotationsSet(Strategy.Context<Graph.Annotations> ctx) {
        return this.composeStrategyUnaryOperator(s -> s.getGraphAnnotationsSet(ctx));
    }

    /**
     * Compute a new strategy function from the sequence of supplied {@link GraphStrategy} objects.
     *
     * @param f a {@link Function} that extracts a particular strategy implementation from a {@link GraphStrategy}
     * @return a newly constructed {@link UnaryOperator} that applies each extracted strategy implementation in
     *         the order supplied
     */
    private UnaryOperator composeStrategyUnaryOperator(final Function<GraphStrategy, UnaryOperator> f) {
        return this.graphStrategySequence.stream().map(f).reduce(null,
                (acc, next) -> acc == null ? next : toUnaryOp(acc.compose(next)));
    }

    /**
     * Converts a {@link Function} to a {@link UnaryOperator} since the call to
     * {@link UnaryOperator#andThen(java.util.function.Function)} doesn't return {@link UnaryOperator} and can't
     * be casted to one.
     *
     * @param f a {@link Function} that has the same argument and return type
     * @return a {@link UnaryOperator} of the supplied {@code f}
     */
    private static <T> UnaryOperator<T> toUnaryOp(final Function<T,T> f) {
        return new UnaryOperator<T>() {
            @Override
            public T apply(T t) {
                return f.apply(t);
            }
        };
    }
}