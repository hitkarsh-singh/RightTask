import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graphApi } from '../api/graph';
import type { TaskGraph, GraphNode, GraphEdge } from '../types/graph';

export function TaskGraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<TaskGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch graph data
  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await graphApi.getTaskGraph();
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load graph:', err);
        setError('Failed to load task graph');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, []);

  // Initialize D3 force simulation
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const width = 800;
    const height = 500;

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Create a copy of nodes to avoid mutating the original data
    const nodes: GraphNode[] = graphData.nodes.map(d => ({ ...d }));
    const edges: GraphEdge[] = graphData.edges.map(d => ({ ...d }));

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create arrow markers for edges
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');

    // Draw edges
    const linkGroup = svg.append('g').attr('class', 'links');
    const links = linkGroup
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const nodeCircles = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: GraphNode) => 20 + d.priority * 2)
      .attr('fill', (d: GraphNode) => {
        if (d.completed) return '#48bb78'; // Green for completed
        if (selectedNode === d.id) return '#9f7aea'; // Purple for selected
        return '#4299e1'; // Blue for active
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: GraphNode) => {
        setSelectedNode(d.id);
      })
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)
      .call(drag(simulation) as any);

    // Add labels
    const labelGroup = svg.append('g').attr('class', 'labels');
    const labels = labelGroup
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d: GraphNode) => d.label)
      .attr('font-size', 12)
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('fill', '#2d3748')
      .attr('pointer-events', 'none');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeCircles
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 35);
    });

    // Mouse event handlers
    function handleMouseOver(event: any, d: GraphNode) {
      // Highlight node
      d3.select(event.currentTarget)
        .attr('stroke', '#f56565')
        .attr('stroke-width', 3);

      // Show tooltip
      d3.select('body')
        .append('div')
        .attr('class', 'graph-tooltip')
        .style('position', 'absolute')
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px')
        .html(`
          <strong>${d.label}</strong><br/>
          Priority: ${d.priority}<br/>
          Status: ${d.completed ? 'Completed' : 'In Progress'}
        `);
    }

    function handleMouseOut(event: any) {
      // Remove highlight
      d3.select(event.currentTarget)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Remove tooltip
      d3.selectAll('.graph-tooltip').remove();
    }

    // Drag behavior
    function drag(simulation: any) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event: any) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    return () => {
      simulation.stop();
    };
  }, [graphData, selectedNode]);

  if (loading) {
    return (
      <div className="graph-visualization">
        <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
          Loading graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="graph-visualization">
        <div style={{ textAlign: 'center', padding: '50px', color: '#e53e3e' }}>
          {error}
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <div className="graph-visualization">
        <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>
          No tasks to visualize. Create some tasks to see the graph!
        </div>
      </div>
    );
  }

  return (
    <div className="graph-visualization">
      <svg ref={svgRef}></svg>
    </div>
  );
}
