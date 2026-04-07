import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MotionConfig, useReducedMotion } from "framer-motion";
import SmoothScroll from "@/components/SmoothScroll";
import NoiseOverlay from "@/components/NoiseOverlay";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import OnboardingModal from "@/components/OnboardingModal";
import LoadingScreen from "@/components/garden/LoadingScreen";
import { useAuth } from "@/hooks/use-auth";
import StarBackground from "@/components/StarBackground";
import IllustrationLayer from "@/components/IllustrationLayer";

const Home = lazy(() => import("@/pages/Home"));
const Garden = lazy(() => import("@/pages/Garden"));
const Collections = lazy(() => import("@/pages/Collections"));
const PublicCollection = lazy(() => import("@/pages/PublicCollection"));
const WriterProfile = lazy(() => import("@/pages/WriterProfile"));
const PublicGarden = lazy(() => import("@/pages/PublicGarden"));
const EditorStudio = lazy(() => import("@/pages/EditorStudio"));
const InBloom = lazy(() => import("@/pages/Gallery"));
const PageGallery = lazy(() => import("@/pages/PageGallery"));
const Piece = lazy(() => import("@/pages/Piece"));
const About = lazy(() => import("@/pages/About"));
const Courses = lazy(() => import("@/pages/Courses"));
const Drafts = lazy(() => import("@/pages/Drafts"));
const Atelier = lazy(() => import("@/pages/Atelier"));
const Weave = lazy(() => import("@/pages/Weave"));
const EditorOnboarding = lazy(() => import("@/pages/EditorOnboarding"));
const ExerciseAdmin = lazy(() => import("@/pages/ExerciseAdmin"));
const SignIn = lazy(() => import("@/pages/SignIn"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Accessibility = lazy(() => import("@/pages/Accessibility"));
const Commons = lazy(() => import("@/pages/Commons"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const GardenInfo = lazy(() => import("@/pages/GardenInfo"));
const FieldGuide = lazy(() => import("@/pages/FieldGuide"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const GardenGuide = lazy(() => import("@/pages/GardenGuide"));
const ContactEditors = lazy(() => import("@/pages/ContactEditors"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Publications = lazy(() => import("@/pages/Publications"));
const Opportunities = lazy(() => import("@/pages/Opportunities"));
const Submissions = lazy(() => import("@/pages/Submissions"));
const ForJournals = lazy(() => import("@/pages/ForJournals"));
const Saved = lazy(() => import("@/pages/Saved"));

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ReadingRoom = lazy(() => import("@/pages/ReadingRoom"));
const Community = lazy(() => import("@/pages/Community"));
const EditorialDashboard = lazy(() => import("@/pages/EditorialDashboard"));
const EditorialPayment = lazy(() => import("@/pages/EditorialPayment"));
const EditorialRoom = lazy(() => import("@/pages/EditorialRoom"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Challenges = lazy(() => import("@/pages/Challenges"));
const Exhibits = lazy(() => import("@/pages/Exhibits"));
const Exhibit = lazy(() => import("@/pages/Exhibit"));
const WorkshopRoom = lazy(() => import("@/pages/WorkshopRoom"));
const Cultivator = lazy(() => import("@/pages/Cultivator"));
const Grove = lazy(() => import("@/pages/Grove"));

function ProtectedRoute({ component: Component, path }: { component: React.ComponentType; path: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Redirect to="/sign-in" />;
  }
  return <Component />;
}

// T-audit: Editor-only route — requires editor or editor_in_chief role
function EditorProtectedRoute({ component: Component, path }: { component: React.ComponentType; path: string }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Redirect to="/sign-in" />;
  }
  if (user.role !== "editor" && user.role !== "editor_in_chief") {
    return <Redirect to="/" />;
  }
  return <Component />;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "The Page Gallery Journal — A Literary Journal & Writing Garden",
  "/in-bloom": "The Journal — The Page Gallery",
  "/publications": "Archive & Contributors — The Page Gallery",
  "/gallery": "The Journal — The Page Gallery",
  "/journal": "The Journal — The Page Gallery",
  "/about": "About — The Page Gallery Journal",
  "/garden": "My Garden — The Page Gallery",
  "/commons": "The Commons — The Page Gallery",
  "/how-it-works": "How It Works — The Page Gallery",
  "/garden-info": "Garden Seasons — The Page Gallery",
  "/privacy": "Privacy Policy — The Page Gallery",
  "/terms": "Terms of Service — The Page Gallery",
  "/accessibility": "Accessibility — The Page Gallery",
  "/sign-in": "Sign In — The Page Gallery",
  "/for-journals": "For Journals — The Page Gallery",
  "/saved": "Saved Pieces — The Page Gallery",
};

function PageTitle() {
  const [location] = useLocation();
  useEffect(() => {
    if (location.startsWith("/piece/")) {
      return;
    }
    const title = PAGE_TITLES[location] || "The Page Gallery Journal";
    document.title = title;
  }, [location]);
  return null;
}

function Router() {
  return (
    <main id="main-content">
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/garden">{() => <ProtectedRoute component={Garden} path="/garden" />}</Route>
        <Route path="/collections">{() => <ProtectedRoute component={Collections} path="/collections" />}</Route>
        <Route path="/collection/:id" component={PublicCollection} />
        <Route path="/writer/:username" component={WriterProfile} />
        <Route path="/garden/:username" component={PublicGarden} />
        <Route path="/public-garden/:userId">
          {(params) => <Redirect to={`/garden/${params.userId}`} />}
        </Route>
        <Route path="/editor-studio">{() => <EditorProtectedRoute component={EditorStudio} path="/editor-studio" />}</Route>
        <Route path="/in-bloom" component={InBloom} />
        <Route path="/gallery" component={PageGallery} />
        <Route path="/piece/:id" component={Piece} />
        <Route path="/weave/:id" component={Weave} />
        <Route path="/about" component={About} />
        <Route path="/publications" component={Publications} />
        <Route path="/courses" component={Courses} />
        <Route path="/drafts">{() => <ProtectedRoute component={Drafts} path="/drafts" />}</Route>
        <Route path="/editor-onboarding">{() => <EditorProtectedRoute component={EditorOnboarding} path="/editor-onboarding" />}</Route>
        <Route path="/exercise-admin">{() => <EditorProtectedRoute component={ExerciseAdmin} path="/exercise-admin" />}</Route>
        <Route path="/sign-in" component={SignIn} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/accessibility" component={Accessibility} />
        <Route path="/commons" component={Commons} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/garden-info" component={GardenInfo} />
        <Route path="/field-guide" component={FieldGuide} />
        <Route path="/edit-profile">{() => <ProtectedRoute component={EditProfile} path="/edit-profile" />}</Route>
        <Route path="/garden-guide" component={GardenGuide} />
        <Route path="/contact-editors" component={ContactEditors} />
        <Route path="/opportunities" component={Opportunities} />
        <Route path="/submissions" component={Submissions} />
        <Route path="/for-journals" component={ForJournals} />
        <Route path="/saved">{() => <ProtectedRoute component={Saved} path="/saved" />}</Route>
        <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} path="/dashboard" />}</Route>
        <Route path="/reading-room">{() => <ProtectedRoute component={ReadingRoom} path="/reading-room" />}</Route>
        <Route path="/community" component={Community} />
        <Route path="/editorial-dashboard">{() => <EditorProtectedRoute component={EditorialDashboard} path="/editorial-dashboard" />}</Route>
        <Route path="/eic-dashboard">
          {() => <Redirect to="/editorial-dashboard" />}
        </Route>
        <Route path="/editorial-payment">{() => <ProtectedRoute component={EditorialPayment} path="/editorial-payment" />}</Route>
        <Route path="/editorial-room">{() => <EditorProtectedRoute component={EditorialRoom} path="/editorial-room" />}</Route>
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/exhibits" component={Exhibits} />
        <Route path="/exhibits/:slug" component={Exhibit} />
        <Route path="/workshop-room">{() => <ProtectedRoute component={WorkshopRoom} path="/workshop-room" />}</Route>
        <Route path="/cultivator" component={Cultivator} />
        <Route path="/grove">{() => <ProtectedRoute component={Grove} path="/grove" />}</Route>
        <Route path="/atelier" component={Atelier} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
    </main>
  );
}

function App() {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) {
    // Ensure reduced motion preference is observed; MotionConfig user setting handles it.
  }

  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SmoothScroll>
            <StarBackground />
            <IllustrationLayer />
            <NoiseOverlay />
            <AccessibilityToolbar />
            <OnboardingModal />
            <PageTitle />
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
            <Toaster />
          </SmoothScroll>
        </TooltipProvider>
      </QueryClientProvider>
    </MotionConfig>
  );
}

export default App;
