import {
  House,
  ClipboardList,
  Camera,
  CircleUserRound,
  UserRound,
  RefreshCw,
  ClipboardCheck,
  Route,
  Activity,
  ImagePlus,
  CalendarDays,
  MapPinned,
  LayoutDashboard,
  Package,
  UsersRound,
  Settings,
  Plus,
  Cloud,
  CloudCog,
  Bell,
  CircleAlert,
  CircleCheck,
  Archive,
} from "lucide-react";

const defaultIconProps = {
  size: 20,
  strokeWidth: 1.9,
};

export const GardenIcons = {
  // 员工端底部 Tab
  StaffHome: (props) => <House {...defaultIconProps} {...props} />,
  StaffTask: (props) => <ClipboardList {...defaultIconProps} {...props} />,
  StaffReport: (props) => <Camera {...defaultIconProps} {...props} />,
  StaffMine: (props) => <CircleUserRound {...defaultIconProps} {...props} />,
  StaffUser: (props) => <UserRound {...defaultIconProps} {...props} />,

  // 员工端页面内图标
  Refresh: (props) => <RefreshCw {...defaultIconProps} {...props} />,
  TodayTask: (props) => <ClipboardCheck {...defaultIconProps} {...props} />,
  ServiceRoute: (props) => <Route {...defaultIconProps} {...props} />,
  Rhythm: (props) => <Activity {...defaultIconProps} {...props} />,
  UploadPhoto: (props) => <ImagePlus {...defaultIconProps} {...props} />,
  Calendar: (props) => <CalendarDays {...defaultIconProps} {...props} />,
  Map: (props) => <MapPinned {...defaultIconProps} {...props} />,

  // 商户端侧边栏图标
  Dashboard: (props) => <LayoutDashboard {...defaultIconProps} {...props} />,
  Orders: (props) => <ClipboardList {...defaultIconProps} {...props} />,
  Monitor: (props) => <Activity {...defaultIconProps} {...props} />,
  Products: (props) => <Package {...defaultIconProps} {...props} />,
  Customers: (props) => <UsersRound {...defaultIconProps} {...props} />,
  Settings: (props) => <Settings {...defaultIconProps} {...props} />,

  // 商户端操作图标
  Create: (props) => <Plus {...defaultIconProps} {...props} />,
  Cloud: (props) => <Cloud {...defaultIconProps} {...props} />,
  CloudSettings: (props) => <CloudCog {...defaultIconProps} {...props} />,
  Todo: (props) => <Bell {...defaultIconProps} {...props} />,
  Warning: (props) => <CircleAlert {...defaultIconProps} {...props} />,
  Done: (props) => <CircleCheck {...defaultIconProps} {...props} />,
  Archive: (props) => <Archive {...defaultIconProps} {...props} />,
};
