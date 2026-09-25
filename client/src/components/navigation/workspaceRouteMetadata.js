/**
 * Centralized Workspace Route Metadata
 * Maps known workspace content routes to clean, human-facing portal terminology.
 */
export const WORKSPACE_ROUTE_METADATA = {
  '/workspace/laws': {
    label: 'Laws',
    path: '/workspace/laws',
    description: 'Indian Digital Law Index'
  },
  '/workspace/crimes': {
    label: 'Cyber Crimes',
    path: '/workspace/crimes',
    description: 'Cybercrime Library'
  },
  '/workspace/cases': {
    label: 'Case Studies',
    path: '/workspace/cases',
    description: 'Incident Case Studies'
  },
  '/workspace/prevention': {
    label: 'Prevention',
    path: '/workspace/prevention',
    description: 'Prevention & Digital Hygiene'
  },
  '/workspace/resources': {
    label: 'Resources',
    path: '/workspace/resources',
    description: 'Official Cyber & Legal Resources'
  }
};

export const WORKSPACE_ROOT = {
  label: 'Workspace',
  path: '/dashboard'
};
