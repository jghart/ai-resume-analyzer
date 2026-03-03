import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route('/auth', "routes/auth.tsx"),
  route('/upload', "routes/upload.tsx"),
  route('/resumes/:id', "routes/resume-detail.tsx"),
] satisfies RouteConfig;