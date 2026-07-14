export enum AbilityAction {
  // base actions
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
  Restore = 'restore',
  HardDelete = 'hard_delete',
  SoftDelete = 'soft_delete',
  // utility actions
  Approval = 'approval',
  Send = 'send',
  MARK_AS_IN_REVIEW = 'mark_as_in_review',
  REMOVE_FROM_REVIEW = 'remove_from_review',
}
