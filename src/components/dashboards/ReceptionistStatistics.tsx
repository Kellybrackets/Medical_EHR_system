import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { usePatients } from '../../hooks/usePatients';
import { calculateAge } from '../../utils/patientUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const ReceptionistStatistics = () => {
  const { patients } = usePatients();

  // 1. Daily Activity (Registrations per day) - Last 7 days
  const dailyActivityData = useMemo(() => {
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      })
      .reverse();

    return last7Days.map((date) => {
      const dayPatients = patients.filter((p) => p.createdAt.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: dayPatients.length,
      };
    });
  }, [patients]);

  // 2. Gender Distribution
  const genderData = useMemo(() => {
    const male = patients.filter((p) => p.sex === 'Male').length;
    const female = patients.filter((p) => p.sex === 'Female').length;
    return [
      { name: 'Male', value: male },
      { name: 'Female', value: female },
    ];
  }, [patients]);

  // 3. Age Groups
  const ageData = useMemo(() => {
    const groups = {
      '0-12': 0,
      '13-19': 0,
      '20-39': 0,
      '40-59': 0,
      '60+': 0,
    };

    patients.forEach((p) => {
      const age = calculateAge(p.dateOfBirth);
      if (age <= 12) groups['0-12']++;
      else if (age <= 19) groups['13-19']++;
      else if (age <= 39) groups['20-39']++;
      else if (age <= 59) groups['40-59']++;
      else groups['60+']++;
    });

    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [patients]);

  // 4. Payment Methods
  const paymentData = useMemo(() => {
    const cash = patients.filter((p) => p.paymentMethod === 'cash').length;
    const medicalAid = patients.filter((p) => p.paymentMethod === 'medical_aid').length;
    return [
      { name: 'Cash', value: cash },
      { name: 'Medical Aid', value: medicalAid },
    ];
  }, [patients]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Registrations */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Daily Registrations (Last 7 Days)</h3>
          </Card.Header>
          <Card.Content>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Payment Methods */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
          </Card.Header>
          <Card.Content>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#8b5cf6'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Demographics - Gender */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Gender Distribution</h3>
          </Card.Header>
          <Card.Content>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    <Cell fill="#0ea5e9" /> {/* Male - Sky Blue */}
                    <Cell fill="#ec4899" /> {/* Female - Pink */}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>

        {/* Demographics - Age Groups */}
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium text-gray-900">Age Demographics</h3>
          </Card.Header>
          <Card.Content>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Detailed Activity Log Table */}
      <Card>
        <Card.Header>
          <h3 className="text-lg font-medium text-gray-900">Recent Registrations (Data View)</h3>
        </Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age/Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patients.slice(0, 10).map((patient) => (
                  <tr key={patient.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(patient.createdAt).toLocaleDateString()}{' '}
                      {new Date(patient.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.firstName} {patient.surname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateAge(patient.dateOfBirth)} / {patient.sex}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${patient.paymentMethod === 'medical_aid' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {patient.paymentMethod === 'medical_aid' ? 'Medical Aid' : 'Cash'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
};
