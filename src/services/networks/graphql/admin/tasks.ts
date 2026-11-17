import { gql } from "@apollo/client";

/**
 * Admin tasks (admin-service `AdminTaskService` via the gateway's
 * `AdminTaskModule`). Contract: docs/admin-tasks/contract.md in the backend repo.
 *
 * Person ids are for picking/assigning only — screens show `email`.
 */

export const ADMIN_TASK_FIELDS = gql`
  fragment AdminTaskFields on AdminTask {
    id
    title
    description
    status
    priority
    assignee {
      id
      email
      role
    }
    createdBy {
      id
      email
      role
    }
    dueAt
    blockedReason
    linkType
    linkId
    checklistTotal
    checklistDone
    commentCount
    overdue
    startedAt
    completedAt
    cancelledAt
    createdAt
    updatedAt
    permissions {
      canEdit
      canReassign
      canChangeStatus
      canCancel
      canManageChecklist
      canComment
    }
  }
`;

export const ADMIN_TASK_DETAIL_FIELDS = gql`
  fragment AdminTaskDetailFields on AdminTaskDetail {
    task {
      ...AdminTaskFields
    }
    checklist {
      id
      text
      done
      doneAt
      doneBy {
        id
        email
      }
      position
    }
    comments {
      id
      author {
        id
        email
      }
      body
      createdAt
    }
    events {
      id
      type
      actor {
        id
        email
      }
      fromLabel
      toLabel
      note
      createdAt
    }
  }
  ${ADMIN_TASK_FIELDS}
`;

export const ADMIN_TASK_TEAM = gql`
  query AdminTaskTeam {
    adminTaskTeam {
      viewerCanAssignOthers
      members {
        canAssignOthers
        isViewer
        admin {
          id
          email
          role
        }
      }
    }
  }
`;

export const ADMIN_TASKS = gql`
  query AdminTasks($input: AdminTaskListInput) {
    adminTasks(input: $input) {
      nextCursor
      tasks {
        ...AdminTaskFields
      }
    }
  }
  ${ADMIN_TASK_FIELDS}
`;

export const ADMIN_TASK = gql`
  query AdminTask($id: ID!) {
    adminTask(id: $id) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const ADMIN_TASK_STATS = gql`
  query AdminTaskStats {
    adminTaskStats {
      totals {
        open
        overdue
        blocked
        doneLast7Days
      }
      members {
        todo
        inProgress
        blocked
        overdue
        doneLast7Days
        avgHoursToDone
        admin {
          id
          email
          role
        }
      }
    }
  }
`;

export const MY_ADMIN_TASK_COUNTS = gql`
  query MyAdminTaskCounts {
    myAdminTaskCounts {
      open
      overdue
    }
  }
`;

export const CREATE_ADMIN_TASK = gql`
  mutation CreateAdminTask($input: CreateAdminTaskInput!) {
    createAdminTask(input: $input) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const UPDATE_ADMIN_TASK = gql`
  mutation UpdateAdminTask($input: UpdateAdminTaskInput!) {
    updateAdminTask(input: $input) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const ASSIGN_ADMIN_TASK = gql`
  mutation AssignAdminTask($taskId: ID!, $assigneeId: ID!) {
    assignAdminTask(taskId: $taskId, assigneeId: $assigneeId) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const CHANGE_ADMIN_TASK_STATUS = gql`
  mutation ChangeAdminTaskStatus($taskId: ID!, $status: AdminTaskStatus!, $blockedReason: String) {
    changeAdminTaskStatus(taskId: $taskId, status: $status, blockedReason: $blockedReason) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const ADD_ADMIN_TASK_CHECKLIST_ITEM = gql`
  mutation AddAdminTaskChecklistItem($taskId: ID!, $text: String!) {
    addAdminTaskChecklistItem(taskId: $taskId, text: $text) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const SET_ADMIN_TASK_CHECKLIST_ITEM_DONE = gql`
  mutation SetAdminTaskChecklistItemDone($taskId: ID!, $itemId: ID!, $done: Boolean!) {
    setAdminTaskChecklistItemDone(taskId: $taskId, itemId: $itemId, done: $done) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const REMOVE_ADMIN_TASK_CHECKLIST_ITEM = gql`
  mutation RemoveAdminTaskChecklistItem($taskId: ID!, $itemId: ID!) {
    removeAdminTaskChecklistItem(taskId: $taskId, itemId: $itemId) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;

export const ADD_ADMIN_TASK_COMMENT = gql`
  mutation AddAdminTaskComment($taskId: ID!, $body: String!) {
    addAdminTaskComment(taskId: $taskId, body: $body) {
      ...AdminTaskDetailFields
    }
  }
  ${ADMIN_TASK_DETAIL_FIELDS}
`;
