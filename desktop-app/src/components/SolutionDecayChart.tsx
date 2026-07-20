import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface SolutionDecayChartProps {
  lambda: number;
  baseScore: number;
  currentDaysAgo: number;
  currentScore: number;
}

export const SolutionDecayChart: React.FC<SolutionDecayChartProps> = ({
  lambda,
  baseScore,
  currentDaysAgo,
  currentScore,
}) => {
  const daysData: number[] = [];
  const scoreData: number[] = [];

  for (let day = 0; day <= 60; day += 2) {
    daysData.push(day);
    const score = baseScore * Math.exp(-lambda * day);
    scoreData.push(Number(score.toFixed(4)));
  }

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#090f1e',
      borderColor: '#1d4ed8',
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'JetBrains Mono' },
      formatter: (params: any) => {
        const p = params[0];
        return `<div class="font-mono">
          <div class="text-[#fdad00] font-bold">Day ${p.name}</div>
          <div class="text-slate-200">Decay Score: <b>${p.value}</b></div>
          <div class="text-slate-400 text-[10px]">exp(-${lambda} * ${p.name})</div>
        </div>`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      name: 'Days',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      data: daysData,
      axisLine: { lineStyle: { color: '#1a2c4e' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' },
    },
    yAxis: {
      type: 'value',
      name: 'Score',
      nameTextStyle: { color: '#94a3b8', fontSize: 11 },
      min: 0,
      max: 1.0,
      axisLine: { lineStyle: { color: '#1a2c4e' } },
      splitLine: { lineStyle: { color: '#0e192e' } },
      axisLabel: { color: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono' },
    },
    series: [
      {
        name: 'Exponential Decay Score',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#fdad00',
          width: 3,
        },
        itemStyle: {
          color: '#ffca3a',
          borderColor: '#1d4ed8',
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.45)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.02)' },
          ]),
        },
        data: scoreData,
        markPoint: {
          data: [
            {
              coord: [Math.floor(currentDaysAgo / 2), Number(currentScore.toFixed(4))],
              name: 'Current Score',
              symbol: 'pin',
              symbolSize: 45,
              itemStyle: { color: '#2563eb' },
              label: {
                show: true,
                formatter: 'Now',
                fontSize: 10,
                color: '#ffffff',
                fontFamily: 'Inter',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <div className="w-full h-full min-h-[260px]">
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};
