import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  announcementCreatePermission,
  announcementUpdatePermission,
} from '@k-phoen/backstage-plugin-announcements-common';
import {
  announcementCreateRouteRef,
  announcementEditRouteRef,
  announcementViewRouteRef,
} from '../routes';
import { AnnouncementsPage } from './AnnouncementsPage';
import { AnnouncementPage } from './AnnouncementPage';
import { CreateAnnouncementPage } from './CreateAnnouncementPage';
import { EditAnnouncementPage } from './EditAnnouncementPage';

type RouterProps = {
  themeId?: string;
  title?: string;
  subtitle?: string;
};

export const Router = (props: RouterProps) => {
  const propsWithDefaults = {
    themeId: 'home',
    title: 'Announcements',
    ...props,
  };

  return (
    <Routes>
      <Route path="/" element={<AnnouncementsPage {...propsWithDefaults} />} />
      <Route
        path={`${announcementViewRouteRef.path}`}
        element={<AnnouncementPage {...propsWithDefaults} />}
      />
      <Route
        path={`${announcementCreateRouteRef.path}`}
        element={
          <RequirePermission permission={announcementCreatePermission}>
            <CreateAnnouncementPage {...propsWithDefaults} />
          </RequirePermission>
        }
      />
      <Route
        path={`${announcementEditRouteRef.path}`}
        element={
          <RequirePermission permission={announcementUpdatePermission}>
            <EditAnnouncementPage {...propsWithDefaults} />
          </RequirePermission>
        }
      />
    </Routes>
  );
};
