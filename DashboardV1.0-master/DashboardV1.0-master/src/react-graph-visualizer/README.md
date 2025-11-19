# Graph Visualizer React App

A modern, interactive React application for visualizing knowledge graphs with physics-based simulations and rich filtering capabilities.

## Features

🌐 **Interactive Graph Visualization**
- 2D and 3D graph rendering
- Physics-based node simulation
- Drag and drop node manipulation
- Zoom and pan interactions

🎨 **Rich Visual Customization**
- Distinct colors for different node types
- Adjustable node sizes and edge widths
- Toggle labels and physics simulation
- Color coding by node type

🔍 **Advanced Filtering**
- Filter nodes by type
- Filter edges by relationship type
- Real-time statistics
- Interactive legends

📊 **Statistics Dashboard**
- Total nodes and edges count
- Node and edge type distribution
- Top node types by frequency
- Live updates based on filters

## Installation

1. Navigate to the project directory:
```bash
cd react-graph-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Data Format

The app expects a JSON file with the following structure:
```json
{
  "nodes": [
    {
      "id": "unique_id",
      "labels": ["NodeType"],
      "properties": {
        "name": "Node Name",
        "other_prop": "value"
      }
    }
  ],
  "edges": [
    {
      "source": "node_id_1",
      "target": "node_id_2",
      "type": "RELATIONSHIP_TYPE",
      "properties": {}
    }
  ]
}
```

## Controls

### Visualization Settings
- **3D View**: Toggle between 2D and 3D visualization
- **Physics Simulation**: Enable/disable physics-based node movement
- **Show Labels**: Toggle node labels visibility
- **Color by Type**: Use distinct colors for different node types
- **Node Size**: Adjust the size of all nodes
- **Link Width**: Adjust the thickness of edges

### Filtering
- **Node Types**: Filter graph to show only selected node types
- **Edge Types**: Filter graph to show only selected relationship types

### Interactions
- **Drag**: Click and drag nodes to move them (when physics is enabled)
- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Click and drag empty space to pan around
- **Hover**: Hover over nodes and edges for detailed information

## Technologies Used

- **React 18**: Modern React with hooks
- **Material-UI**: Beautiful, accessible UI components
- **react-force-graph**: High-performance graph visualization
- **D3.js**: Data-driven graph layouts and physics
- **Three.js**: 3D rendering capabilities

## Performance

The app is optimized for large graphs with:
- Efficient rendering using Canvas API
- Configurable physics simulation
- Smart filtering and data processing
- Responsive design for all screen sizes

## Customization

You can easily customize:
- Color schemes in the `PREDEFINED_COLORS` array
- Node and edge rendering in the canvas functions
- Layout algorithms and physics parameters
- UI components and styling

Enjoy exploring your knowledge graphs! 🚀
