import {
  ArrowLeft,
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
  X,
  Search,
  Phone,
  MapPin,
  BadgeDollarSign,
  Sprout,
  Check,
  TriangleAlert,
  ListFilter,
  Image,
  UserCog,
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
  Team: (props) => <UsersRound {...defaultIconProps} {...props} />,
  ProjectLeads: ({ size = 20, strokeWidth, ...props }) => (
    <svg
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M640 128c0 25.6-17.066667 42.666667-42.666667 42.666667h-170.666666c-25.6 0-42.666667-17.066667-42.666667-42.666667s17.066667-42.666667 42.666667-42.666667h170.666666c25.6 0 42.666667 17.066667 42.666667 42.666667zM682.666667 405.333333c0 12.8-8.533333 21.333333-21.333334 21.333334h-298.666666c-12.8 0-21.333333-8.533333-21.333334-21.333334s8.533333-21.333333 21.333334-21.333333h298.666666c12.8 0 21.333333 8.533333 21.333334 21.333333zM682.666667 533.333333c0 12.8-8.533333 21.333333-21.333334 21.333334h-298.666666c-12.8 0-21.333333-8.533333-21.333334-21.333334s8.533333-21.333333 21.333334-21.333333h298.666666c12.8 0 21.333333 8.533333 21.333334 21.333333zM682.666667 661.333333c0 12.8-8.533333 21.333333-21.333334 21.333334h-298.666666c-12.8 0-21.333333-8.533333-21.333334-21.333334s8.533333-21.333333 21.333334-21.333333h298.666666c12.8 0 21.333333 8.533333 21.333334 21.333333zM682.666667 789.333333c0 12.8-8.533333 21.333333-21.333334 21.333334h-298.666666c-12.8 0-21.333333-8.533333-21.333334-21.333334s8.533333-21.333333 21.333334-21.333333h298.666666c12.8 0 21.333333 8.533333 21.333334 21.333333z" />
      <path d="M725.333333 128h-42.666666v42.666667h42.666666c25.6 0 42.666667 17.066667 42.666667 42.666666v640c0 25.6-17.066667 42.666667-42.666667 42.666667H298.666667c-25.6 0-42.666667-17.066667-42.666667-42.666667V213.333333c0-25.6 17.066667-42.666667 42.666667-42.666666h42.666666V128H298.666667c-46.933333 0-85.333333 38.4-85.333334 85.333333v640c0 46.933333 38.4 85.333333 85.333334 85.333334h426.666666c46.933333 0 85.333333-38.4 85.333334-85.333334V213.333333c0-46.933333-38.4-85.333333-85.333334-85.333333z" />
    </svg>
  ),

  // 商户端操作图标
  Create: (props) => <Plus {...defaultIconProps} {...props} />,
  Cloud: (props) => <Cloud {...defaultIconProps} {...props} />,
  CloudSettings: (props) => <CloudCog {...defaultIconProps} {...props} />,
  Todo: (props) => <Bell {...defaultIconProps} {...props} />,
  Warning: (props) => <CircleAlert {...defaultIconProps} {...props} />,
  Done: (props) => <CircleCheck {...defaultIconProps} {...props} />,
  Archive: (props) => <Archive {...defaultIconProps} {...props} />,
  Filter: (props) => <ListFilter {...defaultIconProps} {...props} />,
  Image: (props) => <Image {...defaultIconProps} {...props} />,
  UserSettings: (props) => <UserCog {...defaultIconProps} {...props} />,

  // 通用操作图标
  Back: (props) => <ArrowLeft {...defaultIconProps} {...props} />,
  Close: (props) => <X {...defaultIconProps} {...props} />,
  Search: (props) => <Search {...defaultIconProps} {...props} />,
  Phone: (props) => <Phone {...defaultIconProps} {...props} />,
  Location: (props) => <MapPin {...defaultIconProps} {...props} />,
  Price: (props) => <BadgeDollarSign {...defaultIconProps} {...props} />,
  Plant: (props) => <Sprout {...defaultIconProps} {...props} />,
  Camera: (props) => <Camera {...defaultIconProps} {...props} />,
  Check: (props) => <Check {...defaultIconProps} {...props} />,
  Alert: (props) => <TriangleAlert {...defaultIconProps} {...props} />,
};
