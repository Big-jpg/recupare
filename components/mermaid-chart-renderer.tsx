// Fixed Interactive Mermaid Chart Renderer Component with Proper Scaling
// components/mermaid-chart-renderer.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Loader2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Type Definitions
// =============================================================================

interface MermaidChartRendererProps {
  mermaidSyntax: string;
  onNodeClick?: (nodeId: string) => void;
  className?: string;
  height?: number;
  width?: number;
}

interface MermaidAPI {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, definition: string) => Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
  mermaidAPI: {
    reset: () => void;
  };
}

// =============================================================================
// Mermaid Chart Renderer Component
// =============================================================================

export function MermaidChartRenderer({
  mermaidSyntax,
  onNodeClick,
  className = '',
  height = 600
}: MermaidChartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mermaid, setMermaid] = useState<MermaidAPI | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(0.6); // Start with smaller initial zoom
  const [renderKey, setRenderKey] = useState(0);

  // =============================================================================
  // Mermaid Initialization with Proper Scaling
  // =============================================================================

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Dynamically import Mermaid to avoid SSR issues
        const mermaidModule = await import('mermaid');
        const mermaidInstance = mermaidModule.default;

        // Initialize Mermaid with configuration optimized for scaling
        mermaidInstance.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12, // Reduced font size for better scaling
          flowchart: {
            useMaxWidth: true, // FIXED: Enable automatic width scaling
            htmlLabels: true,
            curve: 'basis',
            padding: 15, // Reduced padding for more compact layout
            nodeSpacing: 30, // Reduced node spacing
            rankSpacing: 40, // Reduced rank spacing
            diagramPadding: 8 // Reduced diagram padding
          },
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#e5e7eb',
            lineColor: '#6b7280',
            secondaryColor: '#f3f4f6',
            tertiaryColor: '#ffffff',
            background: '#ffffff',
            mainBkg: '#ffffff',
            secondBkg: '#f9fafb',
            tertiaryBkg: '#f3f4f6'
          }
        });

        setMermaid(mermaidInstance as unknown as MermaidAPI);
        console.log('✅ [MERMAID RENDERER] Mermaid loaded successfully with scaling optimizations');
      } catch (err) {
        console.error('💥 [MERMAID RENDERER] Failed to load Mermaid:', err);
        setError('Failed to load Mermaid library');
      }
    };

    loadMermaid();
  }, []);

  // =============================================================================
  // Chart Rendering with Improved SVG Scaling
  // =============================================================================

  useEffect(() => {
    if (!mermaid || !mermaidSyntax || !containerRef.current) return;

    const renderChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🎨 [MERMAID RENDERER] Starting render with scaling optimizations...');

        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Generate unique ID for this render
        const chartId = `mermaid-chart-${Date.now()}-${renderKey}`;

        // Add small delay to ensure DOM is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Render the chart
        const { svg, bindFunctions } = await mermaid.render(chartId, mermaidSyntax);

        if (containerRef.current) {
          // Insert SVG
          containerRef.current.innerHTML = svg;

          // IMPROVED SVG SCALING CONFIGURATION
          const svgElement = containerRef.current.querySelector('svg') as SVGSVGElement | null;
          
          if (svgElement) {
            // Force display and visibility
            svgElement.style.display = 'block';
            svgElement.style.visibility = 'visible';
            svgElement.style.opacity = '1';
            
            // FIXED: Proper responsive scaling configuration
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';
            
            // Preserve aspect ratio and enable scaling
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            
            // Get original viewBox or create one based on SVG dimensions
            let viewBox = svgElement.getAttribute('viewBox');
            if (!viewBox) {
              const bbox = svgElement.getBBox();
              viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;
              svgElement.setAttribute('viewBox', viewBox);
            }
            
            // Apply zoom transform with proper scaling
            svgElement.style.transform = `scale(${zoom})`;
            svgElement.style.transformOrigin = 'center center';
            svgElement.style.transition = 'transform 0.2s ease';

            // Force browser reflow for SVG elements
            svgElement.getBoundingClientRect();
            
            console.log('✅ [MERMAID RENDERER] SVG rendered with improved scaling');
            console.log('📏 [MERMAID RENDERER] ViewBox:', viewBox);
          }

          // Bind click events if callback provided
          if (bindFunctions) {
            bindFunctions(containerRef.current);
          }

          // Add custom click handlers for nodes
          if (onNodeClick) {
            // Wait a bit for DOM to settle
            setTimeout(() => {
              if (containerRef.current) {
                const nodes = containerRef.current.querySelectorAll('.node, [id*="flowchart-"], [class*="node"]');
                console.log(`🎯 [MERMAID RENDERER] Found ${nodes.length} clickable nodes`);
                
                nodes.forEach((node, index) => {
                  const htmlNode = node as HTMLElement;
                  
                  htmlNode.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const nodeId = htmlNode.id || 
                                  htmlNode.getAttribute('data-id') || 
                                  htmlNode.getAttribute('class') || 
                                  `node-${index}`;
                    
                    console.log('🎯 [MERMAID RENDERER] Node clicked:', nodeId);
                    
                    if (nodeId) {
                      onNodeClick(nodeId);
                      toast.success(`Selected node: ${nodeId}`);
                    }
                  });
                  
                  // Add hover effect
                  htmlNode.addEventListener('mouseenter', () => {
                    htmlNode.style.cursor = 'pointer';
                    htmlNode.style.opacity = '0.8';
                  });
                  
                  htmlNode.addEventListener('mouseleave', () => {
                    htmlNode.style.opacity = '1';
                  });
                });
              }
            }, 200);
          }

          // Force final reflow after everything is set up
          setTimeout(() => {
            if (containerRef.current) {
              const finalSvgElement = containerRef.current.querySelector('svg') as SVGSVGElement | null;
              if (finalSvgElement) {
                finalSvgElement.style.opacity = '1';
                finalSvgElement.getBoundingClientRect();
                console.log('✅ [MERMAID RENDERER] Final scaling applied');
              }
            }
          }, 300);
        }

        setIsLoading(false);
        console.log('✅ [MERMAID RENDERER] Render complete with scaling optimizations');

      } catch (err) {
        console.error('💥 [MERMAID RENDERER] Rendering error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        setIsLoading(false);
      }
    };

    renderChart();
  }, [mermaid, mermaidSyntax, onNodeClick, zoom, renderKey]);

  // =============================================================================
  // Control Functions with Better Zoom Ranges
  // =============================================================================

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2)); // Smaller increments, lower max
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.2)); // Smaller increments, lower min
  };

  const handleResetZoom = () => {
    setZoom(0.6); // Reset to smaller default zoom
  };

  const handleFitToScreen = () => {
    setZoom(0.4); // Add fit-to-screen option
  };

  const handleRefresh = () => {
    setRenderKey(prev => prev + 1);
  };

  const handleDownload = () => {
    if (!containerRef.current) return;

    const svgElement = containerRef.current.querySelector('svg') as SVGSVGElement | null;
    if (!svgElement) return;

    try {
      // Create a blob from the SVG
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create download link
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lineage-diagram.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Diagram downloaded as SVG');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download diagram');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // =============================================================================
  // Render
  // =============================================================================

  if (!mermaid) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Mermaid</h3>
            <p className="text-gray-600">Initializing chart renderer...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Rendering Error</h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                Retry
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Reload Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerClasses = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : className;

  const containerHeight = isFullscreen ? '100vh' : height;

  return (
    <Card className={containerClasses}>
      <CardContent className="p-0 relative">
        {/* Enhanced Control Bar */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.2}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            title="Reset Zoom (60%)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleFitToScreen}
            title="Fit to Screen (40%)"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-gray-300" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            title="Refresh diagram"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            title="Download SVG"
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-spin" />
              <p className="text-sm text-gray-600">Rendering diagram with scaling optimizations...</p>
            </div>
          </div>
        )}

        {/* Chart Container with Improved Scaling */}
        <div 
          ref={containerRef}
          className="w-full overflow-auto bg-gray-50 flex items-center justify-center"
          style={{ 
            height: containerHeight,
            minHeight: height
          }}
        />

        {/* Fullscreen Overlay */}
        {isFullscreen && (
          <div 
            className="absolute inset-0 bg-black/20 cursor-pointer"
            onClick={toggleFullscreen}
          />
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Export
// =============================================================================

export default MermaidChartRenderer;