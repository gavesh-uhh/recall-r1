import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { PatternCluster, ErrorRecord } from '../types/api';

interface ErrorGraphEChartProps {
  patterns: PatternCluster[];
  errors: ErrorRecord[];
  edgeFilter: 'all' | 'patterns' | 'tags' | 'projects';
  graphLayout?: 'force' | 'circular' | 'grid';
  onNodeClick?: (errorId: number) => void;
}

export const ErrorGraphEChart: React.FC<ErrorGraphEChartProps> = ({
  patterns,
  errors,
  edgeFilter,
  graphLayout = 'force',
  onNodeClick,
}) => {
  const nodesMap = new Map<
    number,
    {
      id: string;
      name: string;
      fullName: string;
      category: string;
      symbolSize: number;
      value: string;
      x?: number;
      y?: number;
    }
  >();
  const links: { source: string; target: string; valueText: string; lineStyle?: any }[] = [];
  const addedEdges = new Set<string>();

  const addEdge = (src: number, tgt: number, label: string, style?: any) => {
    if (src === tgt) return;
    const key1 = `${src}-${tgt}`;
    const key2 = `${tgt}-${src}`;
    if (!addedEdges.has(key1) && !addedEdges.has(key2)) {
      addedEdges.add(key1);
      addedEdges.add(key2);
      links.push({
        source: src.toString(),
        target: tgt.toString(),
        valueText: label,
        lineStyle: style,
      });
    }
  };

  errors.forEach((err) => {
    const shortSig =
      err.signature.length > 18 ? `${err.signature.substring(0, 16)}…` : err.signature;

    nodesMap.set(err.id, {
      id: err.id.toString(),
      name: `#${err.id} ${shortSig}`,
      fullName: `#${err.id} ${err.signature}`,
      category: err.project,
      symbolSize: Math.max(36, 28 + (err.solutions?.length || 0) * 8),
      value: `Project: ${err.project} | Language: ${err.language} | Solutions: ${err.solutions?.length || 0}`,
    });
  });

  if (edgeFilter === 'all' || edgeFilter === 'patterns') {
    patterns.forEach((pat) => {
      if (pat.errorIds && pat.errorIds.length > 1) {
        for (let i = 0; i < pat.errorIds.length - 1; i++) {
          addEdge(pat.errorIds[i], pat.errorIds[i + 1], `Cross-Project: ${pat.name}`, {
            color: '#60a5fa',
            width: 3,
          });
        }
      }
    });
  }

  if (edgeFilter === 'all' || edgeFilter === 'tags') {
    for (let i = 0; i < errors.length; i++) {
      for (let j = i + 1; j < errors.length; j++) {
        const e1 = errors[i];
        const e2 = errors[j];
        const sharedTags = e1.tags.filter((t) => e2.tags.includes(t));
        if (sharedTags.length > 0) {
          addEdge(e1.id, e2.id, `Shared Tags: ${sharedTags.join(', ')}`, {
            color: '#34d399',
            width: 2,
            type: 'dashed',
          });
        }
      }
    }
  }

  if (edgeFilter === 'all' || edgeFilter === 'projects') {
    for (let i = 0; i < errors.length; i++) {
      for (let j = i + 1; j < errors.length; j++) {
        const e1 = errors[i];
        const e2 = errors[j];
        if (e1.project.toLowerCase() === e2.project.toLowerCase()) {
          addEdge(e1.id, e2.id, `Same Project: ${e1.project}`, {
            color: '#1d4ed8',
            width: 1.5,
          });
        }
      }
    }
  }

  const categories = Array.from(new Set(errors.map((e) => e.project))).map((p) => ({
    name: p,
  }));

  const nodesList = Array.from(nodesMap.values());

  const total = nodesList.length;
  if (graphLayout === 'grid') {
    const radius = Math.max(180, total * 30);
    nodesList.forEach((node, idx) => {
      const angle = (idx / (total || 1)) * 2 * Math.PI;
      node.x = Math.cos(angle) * radius + 400;
      node.y = Math.sin(angle) * radius + 300;
    });
  } else if (graphLayout === 'force') {
    nodesList.forEach((node, idx) => {
      const angle = idx * 137.5 * (Math.PI / 180);
      const r = Math.sqrt(idx + 1) * 60 + 40;
      node.x = Math.cos(angle) * r + 400;
      node.y = Math.sin(angle) * r + 300;
    });
  }

  const echartsLayoutMode =
    graphLayout === 'circular' ? 'circular' : graphLayout === 'grid' ? 'none' : 'none';

  const option: echarts.EChartsOption = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#090f1e',
      borderColor: '#fdad00',
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'JetBrains Mono' },
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `<div class="font-mono p-1">
            <div class="text-[#fdad00] font-bold">${params.data.fullName || params.data.name}</div>
            <div class="text-slate-300 text-xs mt-1">${params.data.value}</div>
            <div class="text-[#fdad00]/80 text-[10px] mt-1">Click node to inspect related error network</div>
          </div>`;
        } else if (params.dataType === 'edge') {
          return `<div class="font-mono text-xs text-sky-300 p-1">
            <b>Graph Edge:</b> Node ${params.data.source} ↔ Node ${params.data.target}
            <div class="text-slate-200 mt-0.5">${params.data.valueText || ''}</div>
          </div>`;
        }
        return '';
      },
    },
    legend: [
      {
        data: categories.map((a) => a.name),
        textStyle: { color: '#94a3b8', fontSize: 11 },
        top: '2%',
      },
    ],
    series: [
      {
        name: 'Error Graph Topology',
        type: 'graph',
        layout: echartsLayoutMode,
        animation: false,
        data: nodesList,
        links: links,
        categories: categories,
        roam: true,
        circular: {
          rotateLabel: false,
        },
        label: {
          show: true,
          position: graphLayout === 'circular' ? 'right' : 'right',
          formatter: '{b}',
          color: '#f8fafc',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: '#090f1e',
          padding: [3, 6],
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#1e293b',
          distance: 8,
        },
        force: {
          repulsion: 300,
          edgeLength: [100, 160],
          gravity: 0,
          friction: 1.0,
          layoutAnimation: false,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 4,
            color: '#60a5fa',
          },
        },
      },
    ],
  };

  const onChartClick = (param: any) => {
    if (param.dataType === 'node' && onNodeClick) {
      onNodeClick(Number(param.data.id));
    }
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        onEvents={{ click: onChartClick }}
      />
    </div>
  );
};
