import { getImage } from "astro:assets";
import carlaPortrait from "@/assets/testimonials/carla-thorel.webp";
import cleartechLogo from "@/assets/testimonials/cleartech.svg";
import salahPortrait from "@/assets/testimonials/salah-el-jamil.jpg";
import ajcLogo from "@/assets/testimonials/ajc.svg";
import linaPortrait from "@/assets/testimonials/lina-wong.jpg";
import stitchfixLogo from "@/assets/testimonials/stitch-fix.svg";
import andresPortrait from "@/assets/testimonials/andres-enderica.jpg";
import atlanticLogo from "@/assets/testimonials/atlantic-autocold.svg";
import landonPortrait from "@/assets/testimonials/landonmoreno.webp";
import veeexpressLogo from "@/assets/testimonials/vee-express.svg";
import nickPortrait from "@/assets/testimonials/nick-steinman.jpg";
import honeyvilleLogo from "@/assets/testimonials/honeyville.webp";
import isaacPortrait from "@/assets/testimonials/isaacmorley.webp";
import qualityLogo from "@/assets/testimonials/quality-distribution.webp";

const rawTestimonials = [
  {
    quote: "We've had great results and the DataDocks team has been accommodating in making the software fit with what we need. It has helped streamline things on our end so much.",
    author: "Carla Thorel, ClearTech",
    image: carlaPortrait,
    logo: cleartechLogo,
  },
  {
    quote: "DataDocks blew the competition out of the water. They are quick and timely in their responses, and very easy to work with. I recommend them for anyone who needs more than an off the shelf appointment scheduling solution.",
    author: "Salah El-Jamil, AJC Logistics",
    image: salahPortrait,
    logo: ajcLogo,
  },
  {
    quote: "The integration process has been seamless, and the tool is easy for our vendors to use. Whenever we need them, the team is quick to help us resolve any issues.",
    author: "Lina Wong, Stitch Fix",
    image: linaPortrait,
    logo: stitchfixLogo,
  },
  {
    quote: "It's not an expense but an investment. My team loves DataDocks. I don't know how we lived without it.",
    author: "Andres Enderica, Atlantic Autocold",
    image: andresPortrait,
    logo: atlanticLogo,
  },
  {
    quote: "A great help with keeping track of our appointments. I like that automatic email reminders and notices are sent to the trucking company that sets their appointments.",
    author: "Landon Moreno, Vee Express, LLC",
    image: landonPortrait,
    logo: veeexpressLogo,
  },
  {
    quote: "A little over a year in and I couldn't imagine going back to the old ways of using spreadsheets to manage our shipping schedule.",
    author: "Nick Steinman, Food Industry",
    image: nickPortrait,
    logo: null,
  },
  {
    quote: "We can look ahead at what's scheduled, prepare any required documentation in advance, and appropriately staff our team. It's already saved us so much time.",
    author: "Marcasa Ahlstrom, Honeyville Inc.",
    image: null,
    logo: honeyvilleLogo,
  },
  {
    quote: "The automation features that we're using will literally save our company hundreds of labor hours each year",
    author: "Isaac Morley, Quality Distribution LLC",
    image: isaacPortrait,
    logo: qualityLogo,
  },
];

export async function getOptimizedTestimonials() {
  return Promise.all(
    rawTestimonials.map(async (t) => ({
      ...t,
      image: t.image ? (await getImage({ src: t.image, width: 128, height: 128, format: "webp" })).src : null,
      logo: t.logo ? (await getImage({ src: t.logo, width: 300, format: "webp" })).src : null,
    }))
  );
}
