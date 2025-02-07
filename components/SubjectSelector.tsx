"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const subjects = [
  { value: "all", label: "All Subjects", emoji: "🌟" },
  { value: "physics", label: "Physics", emoji: "⚛️" },
  { value: "biology", label: "Biology", emoji: "🧬" },
  { value: "chemistry", label: "Chemistry", emoji: "🧪" },
  { value: "general_science", label: "General Science", emoji: "🔬" },
  { value: "energy", label: "Energy", emoji: "⚡" },
  { value: "earth_science", label: "Earth Science", emoji: "🌍" },
  { value: "astronomy", label: "Astronomy", emoji: "🔭" },
  { value: "math", label: "Math", emoji: "🔢" },
  { value: "computer_science", label: "Computer Science", emoji: "💻" },
]

export function SubjectSelector({ onSubjectsChange }: { onSubjectsChange: (subjects: string[]) => void }) {
  const [open, setOpen] = React.useState(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [selectedSubjects, setSelectedSubjects] = React.useState<string[]>(
    subjects.slice(1).map(s => s.value) // Initialize with all subjects except "all"
  )

  const toggleSubject = (value: string) => {
    setSelectedSubjects((current) => {
      let newSelection;
      if (value === "all") {
        newSelection = current.length === subjects.length - 1 ? [] : subjects.slice(1).map((s) => s.value);
      } else {
        if (current.includes(value)) {
          newSelection = current.filter((item) => item !== value);
        } else {
          newSelection = [...current, value];
        }
      }
      onSubjectsChange(newSelection); // Notify parent of changes
      return newSelection;
    });
  };

  const isSelected = (value: string) => {
    if (value === "all") {
      return selectedSubjects.length === subjects.length - 1
    }
    return selectedSubjects.includes(value)
  }

  const handleConfirm = () => {
    setOpen(false);
    setDrawerOpen(false);
    onSubjectsChange(selectedSubjects); // Ensure parent has final selection
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
        >
          Choose Subjects
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Subject Selection</DrawerTitle>
            <DrawerDescription>Choose one or more subjects you're interested in.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {selectedSubjects.length > 0
                    ? `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? "s" : ""} selected`
                    : "Select subjects..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-white dark:bg-gray-900 border-2">
                <Command className="flex flex-col items-center justify-center">
                  <CommandInput placeholder="Search for a subject..." className="w-full" />
                  <CommandList className="max-h-[200px] w-full">
                    <CommandEmpty>No matching subject found.</CommandEmpty>
                    <CommandGroup>
                      {subjects.map((subject) => (
                        <CommandItem 
                          key={subject.value} 
                          onSelect={() => toggleSubject(subject.value)}
                          className={`${
                            isSelected(subject.value) 
                              ? 'bg-gray-100 dark:bg-gray-800' 
                              : ''
                          } cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                        >
                          <div className={`mr-2 flex h-4 w-4 items-center justify-center`}>
                            {isSelected(subject.value) && <Check className={`h-4 w-4`} />}
                          </div>
                          {subject.emoji} {subject.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <DrawerFooter>
            <Button 
              onClick={handleConfirm}
              className="w-full transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
            >
              Confirm Selection
            </Button>
            <DrawerClose asChild>
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="w-full transition-all duration-300 hover:bg-gray-700 hover:text-white active:bg-gray-800"
              >
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
} 