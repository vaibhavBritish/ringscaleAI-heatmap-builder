import React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqData = [
  {
    question: "What is Ringscale AI's main service?",
    answer: "Ringscale AI focuses on enhancing your local business's online presence through authentic human interactions. Our service guarantees top 3 positions in Google Local Search within specified areas for our Community and City plans."
  },
  {
    question: "How do you guarantee top 3 positions on Google Local Search?",
    answer: "We use advanced AI-powered heatmap tracking and local SEO strategies to identify ranking gaps and optimize your Google Business Profile. Our proven methodology ensures consistent visibility where it matters most."
  },
  {
    question: "Why do I need a pre-structured Google Business Profile?",
    answer: "A well-structured profile is the foundation of local SEO. It allows our system to accurately track your rankings and implement optimizations that Google's algorithm favors."
  },
  {
    question: "How does Ringscale AI enhance my SEO efforts?",
    answer: "By providing real-time data on your local rankings across a grid, we allow you to see exactly where you're winning and where you need improvement, enabling data-driven decisions."
  },
  {
    question: "Why don't you need access to my Google Business Profile or website?",
    answer: "Our scan technology works externally to gather public ranking data. While some features might benefit from integration, our core heatmap scans can be performed without sensitive access."
  },
  {
    question: "What makes some keywords perform better than others?",
    answer: "Keyword performance depends on local competition, search volume, and how well your profile aligns with the intent of those specific searches in your geographic area."
  }
]

const FAQ = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <div className="w-20 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqData.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border-none bg-slate-50 rounded-[2rem] px-8 overflow-hidden transition-all duration-300 data-[state=open]:bg-slate-100/80 data-[state=open]:shadow-lg"
            >
              <AccordionTrigger className="hover:no-underline py-6 group">
                <span className="text-lg md:text-xl font-bold text-slate-800 text-left">
                  <span className="mr-2 text-slate-400 font-black">{index + 1}.</span> {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-lg text-slate-600 font-medium leading-relaxed pb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export default FAQ
