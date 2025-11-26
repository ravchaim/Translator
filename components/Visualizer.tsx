import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, isPlaying }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !analyser || !isPlaying) {
        // Clear if stopped
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        return;
    }

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Config
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barPadding = 2;
    // We only use a subset of the frequency bin to avoid the flat high-end usually found in speech
    const usableBins = Math.floor(bufferLength * 0.7); 
    const barWidth = (width / usableBins) * 2.5; // Spread them out a bit

    let animationId: number;

    const renderFrame = () => {
      animationId = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      svg.selectAll('*').remove();

      svg.selectAll('rect')
        .data(dataArray.slice(0, usableBins))
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * (barWidth + barPadding))
        .attr('y', (d) => height - (d / 255) * height)
        .attr('width', barWidth)
        .attr('height', (d) => (d / 255) * height)
        .attr('fill', (d) => d3.interpolateBlues(d / 200 + 0.2))
        .attr('rx', 2);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
      svg.selectAll('*').remove();
    };
  }, [analyser, isPlaying]);

  return (
    <div className="w-full h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 mt-2">
       {!isPlaying && (
         <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs uppercase tracking-widest">
           Audio Idle
         </div>
       )}
      <svg ref={svgRef} className="w-full h-full" preserveAspectRatio="none" />
    </div>
  );
};