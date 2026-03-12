import React from 'react';
import AdminSeasonalSwitcher from './AdminSeasonalSwitcher';
import AdminCropCalendar from './AdminCropCalendar';

const AdminSeasonalPage: React.FC = () => {
  return (
    <div className="space-y-10">
      <AdminSeasonalSwitcher />
      <hr className="border-stone-200" />
      <AdminCropCalendar />
    </div>
  );
};

export default AdminSeasonalPage;
