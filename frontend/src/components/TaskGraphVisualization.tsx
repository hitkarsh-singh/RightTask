import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { graphApi } from '../api/graph';
import type { TaskGraph, GraphNode, GraphEdge, CriticalPath, ImpactAnalysis } from '../types/graph';

export function TaskGraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<TaskGraph | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPath | null>(null);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showImpact, setShowImpact] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Auto-refresh graph every 5 seconds to pick up changes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Fetch graph data
  useEffect(() => {
    const loadGraph = async () => {
      try {
        setLoading(true);
        setError(null);
        const [graph, critical] = await Promise.all([
          graphApi.getTaskGraph(),
          graphApi.getCriticalPath(),
        ]);
        setGraphData(graph);
        setCriticalPath(critical);
      } catch (err) {
        console.error('Failed to load graph:', err);
        setError('Failed to load task graph');
      } finally {
        setLoading(false);
      }
    };

    loadGraph();
  }, [refreshTrigger]);

  // Fetch impact analysis when node is selected
  useEffect(() => {
    if (selectedNode && showImpact) {
      graphApi.getImpactAnalysis(selectedNode)
        .then(setImpactAnalysis)
        .catch(err => console.error('Failed to load impact analysis:', err));
    } else {
      setImpactAnalysis(null);
    }
  }, [selectedNode, showImpact]);

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

    // Mark nodes as critical or impacted
    const criticalTaskIds = showCriticalPath && criticalPath ? criticalPath.criticalTaskIds : [];
    const impactedTaskIds = showImpact && impactAnalysis ? impactAnalysis.impactedTaskIds : [];

    // Create a copy of nodes to avoid mutating the original data
    const nodes: GraphNode[] = graphData.nodes.map(d => ({
      ...d,
      isCritical: criticalTaskIds.includes(d.id),
      isImpacted: impactedTaskIds.includes(d.id),
    }));
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
    const defs = svg.append('defs');

    // DEPENDS_ON arrow (blue)
    defs.append('marker')
      .attr('id', 'arrowhead-depends')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#4299e1');

    // BLOCKS arrow (red/orange)
    defs.append('marker')
      .attr('id', 'arrowhead-blocks')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#f56565');

    // Critical path arrow (gold)
    defs.append('marker')
      .attr('id', 'arrowhead-critical')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#fbbf24');

    // Draw edges
    const linkGroup = svg.append('g').attr('class', 'links');
    const links = linkGroup
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', (d: GraphEdge) => {
        // Check if this edge is on the critical path
        const sourceNode = nodes.find(n => typeof d.source === 'string' ? n.id === d.source : n.id === (d.source as GraphNode).id);
        const targetNode = nodes.find(n => typeof d.target === 'string' ? n.id === d.target : n.id === (d.target as GraphNode).id);

        if (sourceNode?.isCritical && targetNode?.isCritical && d.type === 'DEPENDS_ON') {
          return '#fbbf24'; // Gold for critical path
        }

        return d.type === 'DEPENDS_ON' ? '#4299e1' : '#f56565';
      })
      .attr('stroke-width', (d: GraphEdge) => {
        const sourceNode = nodes.find(n => typeof d.source === 'string' ? n.id === d.source : n.id === (d.source as GraphNode).id);
        const targetNode = nodes.find(n => typeof d.target === 'string' ? n.id === d.target : n.id === (d.target as GraphNode).id);

        return sourceNode?.isCritical && targetNode?.isCritical && d.type === 'DEPENDS_ON' ? 3 : 2;
      })
      .attr('stroke-dasharray', (d: GraphEdge) => d.type === 'BLOCKS' ? '5,5' : '0')
      .attr('marker-end', (d: GraphEdge) => {
        const sourceNode = nodes.find(n => typeof d.source === 'string' ? n.id === d.source : n.id === (d.source as GraphNode).id);
        const targetNode = nodes.find(n => typeof d.target === 'string' ? n.id === d.target : n.id === (d.target as GraphNode).id);

        if (sourceNode?.isCritical && targetNode?.isCritical && d.type === 'DEPENDS_ON') {
          return 'url(#arrowhead-critical)';
        }

        return d.type === 'DEPENDS_ON' ? 'url(#arrowhead-depends)' : 'url(#arrowhead-blocks)';
      });

    // Draw nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const nodeCircles = nodeGroup
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d: GraphNode) => {
        const baseSize = 20 + d.priority * 2;
        return d.isCritical ? baseSize + 5 : baseSize;
      })
      .attr('fill', (d: GraphNode) => {
        if (d.completed) return '#48bb78'; // Green for completed
        if (selectedNode === d.id) return '#9f7aea'; // Purple for selected
        if (d.isCritical) return '#fbbf24'; // Gold for critical path
        if (d.isImpacted) return '#f97316'; // Orange for impacted
        return '#4299e1'; // Blue for active
      })
      .attr('stroke', (d: GraphNode) => {
        if (d.isCritical) return '#fbbf24';
        if (d.isImpacted) return '#f97316';
        return '#fff';
      })
      .attr('stroke-width', (d: GraphNode) => d.isCritical ? 3 : 2)
      .style('cursor', 'pointer')
      .on('click', (_event: any, d: GraphNode) => {
        setSelectedNode(d.id);
        setShowImpact(true);
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
        .attr('stroke-width', 4);

      // Show tooltip
      const badges: string[] = [];
      if (d.isCritical) badges.push('<span style="color: #fbbf24;">★ Critical Path</span>');
      if (d.isImpacted) badges.push('<span style="color: #f97316;">⚠ Impacted</span>');

      d3.select('body')
        .append('div')
        .attr('class', 'graph-tooltip')
        .style('position', 'absolute')
        .style('left', event.pageX + 10 + 'px')
        .style('top', event.pageY + 10 + 'px')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .html(`
          <strong>${d.label}</strong><br/>
          Priority: ${d.priority}<br/>
          Status: ${d.completed ? 'Completed' : 'In Progress'}
          ${badges.length > 0 ? '<br/>' + badges.join('<br/>') : ''}
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
  }, [graphData, selectedNode, criticalPath, impactAnalysis, showCriticalPath, showImpact]);

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
      <div style={{ marginBottom: '15px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Controls */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            style={{
              padding: '6px 12px',
              background: '#4299e1',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            title="Refresh graph"
          >
            🔄 Refresh
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showCriticalPath}
              onChange={(e) => setShowCriticalPath(e.target.checked)}
            />
            <span>Show Critical Path</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showImpact}
              onChange={(e) => setShowImpact(e.target.checked)}
            />
            <span>Show Impact Analysis</span>
          </label>
        </div>

        {/* Critical Path Info */}
        {showCriticalPath && criticalPath && criticalPath.totalHours > 0 && (
          <div style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ★ Critical Path: {criticalPath.totalHours} hours ({criticalPath.criticalTaskIds.length} tasks)
          </div>
        )}

        {/* Impact Info */}
        {showImpact && impactAnalysis && impactAnalysis.totalImpactedTasks > 0 && (
          <div style={{
            padding: '8px 12px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            ⚠ {impactAnalysis.totalImpactedTasks} tasks would be impacted
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginBottom: '15px',
        padding: '12px',
        background: '#f7fafc',
        borderRadius: '6px',
        fontSize: '12px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#48bb78' }}></div>
          <span>Completed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#4299e1' }}></div>
          <span>Active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fbbf24', border: '2px solid #fbbf24' }}></div>
          <span>Critical Path</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f97316' }}></div>
          <span>Impacted</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '30px', height: '2px', background: '#4299e1' }}></div>
          <span>Depends On</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '30px', height: '2px', background: '#f56565', backgroundImage: 'repeating-linear-gradient(90deg, #f56565 0, #f56565 5px, transparent 5px, transparent 10px)' }}></div>
          <span>Blocks</span>
        </div>
      </div>

      <svg ref={svgRef}></svg>
    </div>
  );
}
