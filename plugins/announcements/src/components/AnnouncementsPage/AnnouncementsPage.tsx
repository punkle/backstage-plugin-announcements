import React, { ReactNode } from 'react';
import { useAsyncRetry } from 'react-use';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  announcementCreatePermission,
  announcementUpdatePermission,
  announcementDeletePermission,
} from '@k-phoen/backstage-plugin-announcements-common';
import { DateTime } from 'luxon';
import {
  Page,
  Header,
  Content,
  Link,
  ItemCardGrid,
  Progress,
  ItemCardHeader,
  ContentHeader,
  LinkButton,
} from '@backstage/core-components';
import { alertApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { parseEntityRef } from '@backstage/catalog-model';
import {
  EntityPeekAheadPopover,
  entityRouteRef,
} from '@backstage/plugin-catalog-react';
import Alert from '@material-ui/lab/Alert';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  makeStyles,
} from '@material-ui/core';
import {
  announcementCreateRouteRef,
  announcementEditRouteRef,
  announcementViewRouteRef,
} from '../../routes';
import { Announcement, announcementsApiRef } from '../../api';
import { DeleteAnnouncementDialog } from './DeleteAnnouncementDialog';
import { useDeleteAnnouncementDialogState } from './useDeleteAnnouncementDialogState';

const useStyles = makeStyles(theme => ({
  cardHeader: {
    color: theme.palette.text.primary,
  },
}));

const AnnouncementCard = ({
  announcement,
  onDelete,
}: {
  announcement: Announcement;
  onDelete: () => void;
}) => {
  const classes = useStyles();
  const viewAnnouncementLink = useRouteRef(announcementViewRouteRef);
  const editAnnouncementLink = useRouteRef(announcementEditRouteRef);
  const entityLink = useRouteRef(entityRouteRef);

  const publisherRef = parseEntityRef(announcement.publisher);
  const title = (
    <Link
      className={classes.cardHeader}
      to={viewAnnouncementLink({ id: announcement.id })}
    >
      {announcement.title}
    </Link>
  );
  const subTitle = (
    <>
      By{' '}
      <EntityPeekAheadPopover entityRef={announcement.publisher}>
        <Link to={entityLink(publisherRef)}>{publisherRef.name}</Link>
      </EntityPeekAheadPopover>
      , {DateTime.fromISO(announcement.created_at).toRelative()}
    </>
  );
  const { loading: loadingDeletePermission, allowed: canDelete } =
    usePermission({ permission: announcementDeletePermission });
  const { loading: loadingUpdatePermission, allowed: canUpdate } =
    usePermission({ permission: announcementUpdatePermission });

  return (
    <Card>
      <CardMedia>
        <ItemCardHeader title={title} subtitle={subTitle} />
      </CardMedia>
      <CardContent>{announcement.excerpt}</CardContent>
      <CardActions>
        {!loadingUpdatePermission && canUpdate && (
          <LinkButton
            to={editAnnouncementLink({ id: announcement.id })}
            color="default"
          >
            <EditIcon />
          </LinkButton>
        )}
        {!loadingDeletePermission && canDelete && (
          <Button onClick={onDelete} color="default">
            <DeleteIcon />
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

const AnnouncementsGrid = () => {
  const announcementsApi = useApi(announcementsApiRef);
  const alertApi = useApi(alertApiRef);

  const {
    value: announcements,
    loading,
    error,
    retry: refresh,
  } = useAsyncRetry(async () => announcementsApi.announcements({}));
  const {
    isOpen: isDeleteDialogOpen,
    open: openDeleteDialog,
    close: closeDeleteDialog,
    announcement: announcementToDelete,
  } = useDeleteAnnouncementDialogState();

  if (loading) {
    return <Progress />;
  } else if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const onCancelDelete = () => {
    closeDeleteDialog();
  };
  const onConfirmDelete = async () => {
    closeDeleteDialog();

    try {
      await announcementsApi.deleteAnnouncementByID(announcementToDelete!.id);

      alertApi.post({ message: 'Announcement deleted.', severity: 'success' });
    } catch (err) {
      alertApi.post({ message: (err as Error).message, severity: 'error' });
    }

    refresh();
  };

  return (
    <>
      <ItemCardGrid>
        {announcements!.map((announcement, index) => (
          <AnnouncementCard
            key={index}
            announcement={announcement}
            onDelete={() => openDeleteDialog(announcement)}
          />
        ))}
      </ItemCardGrid>

      <DeleteAnnouncementDialog
        open={isDeleteDialogOpen}
        onCancel={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
};

type AnnouncementsPageProps = {
  themeId: string;
  title: string;
  subtitle?: ReactNode;
};

export const AnnouncementsPage = (props: AnnouncementsPageProps) => {
  const newAnnouncementLink = useRouteRef(announcementCreateRouteRef);
  const { loading: loadingCreatePermission, allowed: canCreate } =
    usePermission({ permission: announcementCreatePermission });

  return (
    <Page themeId={props.themeId}>
      <Header title={props.title} subtitle={props.subtitle} />

      <Content>
        <ContentHeader title="">
          {!loadingCreatePermission && (
            <LinkButton
              disabled={!canCreate}
              to={newAnnouncementLink()}
              color="primary"
              variant="contained"
            >
              New announcement
            </LinkButton>
          )}
        </ContentHeader>

        <AnnouncementsGrid />
      </Content>
    </Page>
  );
};
