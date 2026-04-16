import Navigation from "@/components/Navigation";
import Hero from "@/components/sections/Hero";
import Featured from "@/components/sections/Featured";
import StudioIntro from "@/components/sections/GardenIntro";
import Footer from "@/components/Footer";
import SocialCTA from "@/components/sections/SocialCTA";

export default function Home() {
  return (
    <div className="min-h-screen studio-paper text-foreground">
      <Navigation />
      <main>
        <Hero />
        <Featured />
        <StudioIntro />
        <SocialCTA />
      </main>
      <Footer />
    </div>
  );
}
