import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { PatternCluster, ErrorRecord, ErrorRelation } from '../types/api';
import { formatSignatureTitle } from '../utils/formatters';

interface ErrorGraphEChartProps {
  patterns: PatternCluster[];
  errors: ErrorRecord[];
  relations: ErrorRelation[];
  edgeFilter: 'all' | 'patterns' | 'tags' | 'projects' | 'persisted';
  graphLayout?: 'force' | 'circular' | 'grid';
  showEdgeLabels?: boolean;
  onNodeClick?: (errorId: number) => void;
}

export const ErrorGraphEChart: React.FC<ErrorGraphEChartProps> = ({
  patterns,
  errors,
  relations,
  edgeFilter,
  graphLayout = 'force',
  showEdgeLabels = true,
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
    const formattedTitle = formatSignatureTitle(err.signature);
    const shortSig =
      formattedTitle.length > 18 ? `${formattedTitle.substring(0, 16)}…` : formattedTitle;

    nodesMap.set(err.id, {
      id: err.id.toString(),
      name: `#${err.id} ${shortSig}`,
      fullName: `#${err.id} ${formattedTitle}`,
      category: err.project,
      symbolSize: Math.max(36, 28 + (err.solutions?.length || 0) * 8),
      value: `Project: ${err.project} | Language: ${err.language} | Solutions: ${err.solutions?.length || 0}`,
    });
  });

  if (edgeFilter === 'all' || edgeFilter === 'persisted') {
    relations.forEach((rel) => {
      let color = '#c9d1d9'; // Default MANUAL color
      let label = `MANUAL: user linked`;
      let style = 'solid';
      
      const e1 = errors.find((e) => e.id === rel.errorAId);
      const e2 = errors.find((e) => e.id === rel.errorBId);
      const sharedTags = e1 && e2 ? e1.tags.filter((t) => e2.tags.includes(t)) : [];

      if (rel.relationType === 'SIGNATURE_MATCH') {
        color = '#fdad00';
        label = `SIGNATURE_MATCH: similar signature`;
      } else if (rel.relationType === 'TAG_MATCH') {
        color = '#3fb950';
        label = sharedTags.length > 0 ? `TAG MATCH: ${sharedTags.join(', ')}` : `TAG MATCH: shared tags`;
      }
      
      addEdge(rel.errorAId, rel.errorBId, label, {
        color: color,
        width: 2,
        type: style,
      });
    });
  }

  if (edgeFilter === 'all' || edgeFilter === 'patterns') {
    patterns.forEach((pat: any) => {
      if (pat.examples && pat.examples.length > 1) {
        for (let i = 0; i < pat.examples.length - 1; i++) {
          addEdge(pat.examples[i].id, pat.examples[i + 1].id, `Cross-Project: ${pat.tag}`, {
            color: '#fdad00',
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
            color: '#3fb950',
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
            color: '#5d6670',
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

  // Turns "Shared Tags: auth, jwt" into a compact "tags: auth, jwt" edge caption
  const shortenReason = (valueText?: string): string => {
    if (!valueText) return '';
    const [kind, ...rest] = valueText.split(': ');
    const payload = rest.join(': ');
    const label =
      kind === 'Shared Tags'
        ? `tags: ${payload}`
        : kind === 'Same Project'
          ? `project: ${payload}`
          : kind === 'Cross-Project'
            ? `pattern: ${payload}`
            : kind === 'SIGNATURE_MATCH'
              ? `sig_match`
              : kind === 'TAG_MATCH'
                ? `tag_match`
                : kind === 'MANUAL'
                  ? `manual`
                  : valueText;
    return label.length > 32 ? `${label.substring(0, 30)}…` : label;
  };

  const edgeLabelStyle = {
    formatter: (params: any) => shortenReason(params.data.valueText),
    fontSize: 9,
    color: '#c9d1d9',
    fontFamily: 'JetBrains Mono, monospace',
    backgroundColor: 'rgba(13, 11, 7, 0.88)',
    borderColor: '#31373f',
    borderWidth: 1,
    borderRadius: 3,
    padding: [2, 5] as [number, number],
  };

  const option: echarts.EChartsOption = {
    animation: false,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#15120d',
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
          backgroundColor: '#13100b',
          padding: [3, 6],
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#31373f',
          distance: 8,
        },
        // Always-visible "why linked" captions on edges (toggleable via prop)
        edgeLabel: {
          show: showEdgeLabels,
          ...edgeLabelStyle,
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
            color: '#fdad00',
          },
          // Hovering an edge reveals its reason even when global labels are off
          edgeLabel: {
            show: true,
            ...edgeLabelStyle,
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
