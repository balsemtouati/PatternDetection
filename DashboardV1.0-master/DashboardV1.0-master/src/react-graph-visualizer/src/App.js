import React, { useState, useEffect, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './index.css';

const PREDEFINED_COLORS = [
  "#FF6B6B", // Red - Project
  "#4ECDC4", // Teal - Team  
  "#45B7D1", // Blue - Challenge
  "#96CEB4", // Green - Solution
  "#FFEAA7", // Yellow - Client
  "#DDA0DD", // Plum - Technology
  "#98D8C8", // Mint - Location
  "#FF7675", // Pink - Industry
  "#74B9FF", // Light Blue - Employee
  "#00B894", // Emerald - JobTitle
  "#FDCB6E", // Orange - Department
  "#6C5CE7", // Purple - Cluster
  "#A29BFE", // Lavender - JobType
  "#FD79A8", // Hot Pink - JobCategory
  "#00CEC9", // Cyan
  "#E17055", // Coral
  "#81ECEC", // Aqua
  "#FAB1A0", // Peach
  "#00B2FF", // Sky Blue
  "#FF6B9D"  // Rose
];

function App() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [nodeSize, setNodeSize] = useState(5);
  const [linkWidth, setLinkWidth] = useState(1);
  const [enablePhysics, setEnablePhysics] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [colorByType, setColorByType] = useState(true);
  const [selectedNodeTypes, setSelectedNodeTypes] = useState([]);
  const [selectedEdgeTypes, setSelectedEdgeTypes] = useState([]);

  // Load and process graph data
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        const response = await fetch('/case_studies_graph.json');
        if (!response.ok) {
          throw new Error('Failed to load graph data');
        }
        const data = await response.json();
        
        // Process nodes - handle the nested data structure
        const processedNodes = data.nodes.map((node, index) => {
          // Handle the nested data structure from your JSON
          const nodeData = node.data || {};
          const labels = nodeData.labels || ['Unknown'];
          const primaryLabel = labels[0];
          
          // Extract properties from the nested structure
          const properties = { ...nodeData };
          delete properties.labels; // Remove labels from properties to avoid duplication
          
          // Get node name from various possible fields
          const name = nodeData.name || 
                      nodeData.title || 
                      nodeData.text || 
                      properties.name || 
                      properties.title ||
                      node.id || 
                      `Node ${index}`;
          
          return {
            id: node.id || `node_${index}`,
            name: name,
            type: primaryLabel,
            labels: labels,
            properties: properties,
            val: Math.max(3, Math.min(15, 5 + Math.random() * 5)) // Random size for now
          };
        });

        // Process edges/relationships
        const processedLinks = (data.edges || data.relationships || []).map((edge, index) => ({
          id: edge.id || `edge_${index}`,
          source: edge.source,
          target: edge.target,
          type: edge.type || edge.relationship_type || 'Unknown',
          properties: edge.properties || {},
          value: edge.weight || edge.value || 1
        })).filter(link => link.source && link.target);

        // Generate distinct colors for node types (ensuring consistency)
        const nodeTypes = [...new Set(processedNodes.map(node => node.type))].sort();
        const nodeColorMap = {};
        
        // Map specific colors to known types for consistency
        const typeColorMapping = {
          'Project': '#FF6B6B',      // Red
          'Team': '#4ECDC4',         // Teal
          'Challenge': '#45B7D1',    // Blue
          'Solution': '#96CEB4',     // Green
          'Client': '#FFEAA7',       // Yellow
          'Technology': '#DDA0DD',   // Plum
          'Location': '#98D8C8',     // Mint
          'Industry': '#FF7675',     // Pink
          'Employee': '#74B9FF',     // Light Blue
          'JobTitle': '#00B894',     // Emerald
          'Department': '#FDCB6E',   // Orange
          'Cluster': '#6C5CE7',      // Purple
          'JobType': '#A29BFE',      // Lavender
          'JobCategory': '#FD79A8'   // Hot Pink
        };
        
        nodeTypes.forEach((type, index) => {
          nodeColorMap[type] = typeColorMapping[type] || PREDEFINED_COLORS[index % PREDEFINED_COLORS.length];
        });

        // Calculate node degrees (number of connections)
        const nodeDegrees = {};
        processedNodes.forEach(node => {
          nodeDegrees[node.id] = 0;
        });
        
        processedLinks.forEach(link => {
          if (nodeDegrees[link.source] !== undefined) {
            nodeDegrees[link.source]++;
          }
          if (nodeDegrees[link.target] !== undefined) {
            nodeDegrees[link.target]++;
          }
        });

        // Find min and max degrees for scaling
        const degrees = Object.values(nodeDegrees);
        const minDegree = Math.min(...degrees, 0);
        const maxDegree = Math.max(...degrees, 1);
        
        // Add colors to nodes and calculate sizes based on number of connections
        processedNodes.forEach(node => {
          node.color = colorByType ? nodeColorMap[node.type] : '#69b3a2';
          
          // Size nodes based on their degree (number of connections)
          const degree = nodeDegrees[node.id] || 0;
          
          // Scale size from 3 to 15 based on degree
          // Nodes with more connections get bigger
          let scaledSize;
          if (maxDegree === minDegree) {
            scaledSize = 6; // Default size if all nodes have same degree
          } else {
            scaledSize = 3 + ((degree - minDegree) / (maxDegree - minDegree)) * 12;
          }
          
          // Ensure minimum and maximum sizes
          node.val = Math.max(3, Math.min(15, scaledSize));
          node.degree = degree; // Store degree for tooltip display
        });

        setGraphData({
          nodes: processedNodes,
          links: processedLinks,
          nodeTypes,
          edgeTypes: [...new Set(processedLinks.map(link => link.type))],
          nodeColorMap
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadGraphData();
  }, [colorByType]);

  // Filter data based on selected types
  const filteredData = useMemo(() => {
    if (!graphData.nodes.length) return { nodes: [], links: [] };

    let filteredNodes = graphData.nodes;
    let filteredLinks = graphData.links;

    // Filter by node types
    if (selectedNodeTypes.length > 0) {
      filteredNodes = graphData.nodes.filter(node => 
        selectedNodeTypes.includes(node.type)
      );
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredLinks = graphData.links.filter(link => 
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
    }

    // Filter by edge types
    if (selectedEdgeTypes.length > 0) {
      filteredLinks = filteredLinks.filter(link => 
        selectedEdgeTypes.includes(link.type)
      );
    }

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, selectedNodeTypes, selectedEdgeTypes]);

  // Node rendering for 2D
  const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = showLabels ? (node.name.length > 20 ? node.name.substring(0, 20) + '...' : node.name) : '';
    const fontSize = Math.max(8, 12/globalScale);
    const size = nodeSize * (node.val || 5) / 5;
    
    // Draw node circle
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw label
    if (showLabels && label && globalScale > 0.5) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px Sans-Serif`;
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 2;
      ctx.fillText(label, node.x, node.y);
      ctx.shadowBlur = 0;
    }
  };

  if (loading) {
    return <div className="loading">🌐 Loading Graph Data...</div>;
  }

  if (error) {
    return <div className="error">❌ Error: {error}</div>;
  }

  const GraphComponent = is3D ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="graph-container">
      {/* Control Panel */}
      <div className="control-panel">
        <Typography variant="h6" gutterBottom>
          🎮 Graph Controls
        </Typography>
        
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Visualization Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={<Switch checked={is3D} onChange={(e) => setIs3D(e.target.checked)} />}
                label="3D View"
              />
              
              <FormControlLabel
                control={<Switch checked={enablePhysics} onChange={(e) => setEnablePhysics(e.target.checked)} />}
                label="Physics Simulation"
              />
              
              <FormControlLabel
                control={<Switch checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />}
                label="Show Labels"
              />
              
              <FormControlLabel
                control={<Switch checked={colorByType} onChange={(e) => setColorByType(e.target.checked)} />}
                label="Color by Type"
              />
              
              <Typography gutterBottom>Node Size: {nodeSize}</Typography>
              <Slider
                value={nodeSize}
                onChange={(e, value) => setNodeSize(value)}
                min={1}
                max={20}
                valueLabelDisplay="auto"
              />
              
              <Typography gutterBottom>Link Width: {linkWidth}</Typography>
              <Slider
                value={linkWidth}
                onChange={(e, value) => setLinkWidth(value)}
                min={0.5}
                max={5}
                step={0.5}
                valueLabelDisplay="auto"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Node Type Filter */}
        {graphData.nodeTypes && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Filter by Node Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth>
                <InputLabel>Node Types</InputLabel>
                <Select
                  multiple
                  value={selectedNodeTypes}
                  onChange={(e) => setSelectedNodeTypes(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {graphData.nodeTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      <span style={{ 
                        display: 'inline-block',
                        width: 12,
                        height: 12,
                        backgroundColor: graphData.nodeColorMap[type],
                        borderRadius: '50%',
                        marginRight: 8
                      }} />
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                size="small" 
                onClick={() => setSelectedNodeTypes([])}
                sx={{ mt: 1 }}
              >
                Clear Filters
              </Button>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Edge Type Filter */}
        {graphData.edgeTypes && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Filter by Edge Types</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth>
                <InputLabel>Edge Types</InputLabel>
                <Select
                  multiple
                  value={selectedEdgeTypes}
                  onChange={(e) => setSelectedEdgeTypes(e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {graphData.edgeTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button 
                size="small" 
                onClick={() => setSelectedEdgeTypes([])}
                sx={{ mt: 1 }}
              >
                Clear Filters
              </Button>
            </AccordionDetails>
          </Accordion>
        )}
      </div>

      {/* Graph Visualization */}
      <GraphComponent
        graphData={filteredData}
        nodeAutoColorBy={colorByType ? "type" : null}
        nodeCanvasObject={!is3D ? nodeCanvasObject : undefined}
        nodeVal={node => nodeSize * (node.val || 5) / 5}
        nodeLabel={node => `
          <div class="node-tooltip">
            <strong>${node.name}</strong><br/>
            Type: ${node.type}<br/>
            Connections: ${node.degree || 0}<br/>
            Properties: ${Object.keys(node.properties).length}<br/>
            ${Object.entries(node.properties).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join('<br/>')}
          </div>
        `}
        linkWidth={link => linkWidth * (link.value || 1)}
        linkLabel={link => `
          <div class="node-tooltip">
            ${link.source.name || link.source} → ${link.target.name || link.target}<br/>
            Type: ${link.type}<br/>
            ${Object.entries(link.properties).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join('<br/>')}
          </div>
        `}
        enableNodeDrag={enablePhysics}
        enablePanInteraction={true}
        enableZoomInteraction={true}
        cooldownTicks={enablePhysics ? 100 : 0}
        d3AlphaDecay={enablePhysics ? 0.0228 : 1}
        d3VelocityDecay={enablePhysics ? 0.4 : 1}
        backgroundColor="rgba(0,0,0,0)"
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}

export default App;
