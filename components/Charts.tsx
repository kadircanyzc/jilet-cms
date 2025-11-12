'use client'

import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Line Chart Component
export function ViewsChart() {
  const data = [
    { name: 'Pzt', views: 4000, posts: 2400 },
    { name: 'Sal', views: 3000, posts: 1398 },
    { name: 'Çar', views: 2000, posts: 9800 },
    { name: 'Per', views: 2780, posts: 3908 },
    { name: 'Cum', views: 1890, posts: 4800 },
    { name: 'Cmt', views: 2390, posts: 3800 },
    { name: 'Paz', views: 3490, posts: 4300 },
  ]

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-6">Görüntülenme & Gönderiler</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          <Area type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" name="Görüntülenme" />
          <Area type="monotone" dataKey="posts" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" name="Gönderiler" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Donut Chart Component
export function ContentDistributionChart() {
  const data = [
    { name: 'Saç Kesimi', value: 400, color: '#2563EB' },
    { name: 'Sakal Tıraşı', value: 300, color: '#7C3AED' },
    { name: 'Cilt Bakımı', value: 200, color: '#F59E0B' },
    { name: 'Kombo Paket', value: 100, color: '#10B981' },
  ]

  return (
    <div className="bg-card rounded-[var(--radius)] border border-border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-6">Hizmet Dağılımı</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-muted-foreground">{item.name}</span>
            </div>
            <span className="font-medium text-card-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
