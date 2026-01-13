"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

interface ProfileFormProps {
  profile: any
  user: any
  onChange: (data: any) => void
}

export function ProfileForm({ profile, user, onChange }: ProfileFormProps) {
  const normalizeMonthInput = (dateValue: any) => {
    if (!dateValue) return ""
    const d = new Date(dateValue)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().slice(0, 7) // YYYY-MM
  }

  const toArray = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(String)
    if (typeof value === "string" && value.trim()) {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) return parsed.map(String)
      } catch {
        return [value]
      }
      return [value]
    }
    return []
  }

  const normalizeProfile = () => {
    const experiences = Array.isArray(profile?.experiences) ? profile?.experiences : []
    const education = Array.isArray(profile?.education) ? profile?.education : []
    return {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
      city: profile?.city || "",
      country: profile?.country || "Schweiz",
      linkedInUrl: profile?.linkedInUrl || "",
      tagline: profile?.tagline || "",
      summary: profile?.summary || "",
      experiences: experiences.map((exp: any, idx: number) => ({
        jobTitle: exp.jobTitle || "",
        company: exp.company || "",
        location: exp.location || "",
        startDate: normalizeMonthInput(exp.startDate),
        endDate: normalizeMonthInput(exp.endDate),
        isCurrent: !!exp.isCurrent,
        bullets: (() => {
          const arr = toArray(exp.bullets)
          return arr.length > 0 ? arr : [""]
        })(),
        order: exp.order ?? idx,
      })),
      education: education.map((edu: any, idx: number) => ({
        degree: edu.degree || "",
        institution: edu.institution || "",
        location: edu.location || "",
        startDate: normalizeMonthInput(edu.startDate),
        endDate: normalizeMonthInput(edu.endDate),
        grade: edu.grade || "",
        order: edu.order ?? idx,
      })),
      skills: profile?.skills || [],
      languages: profile?.languages || [],
      certifications: profile?.certifications || [],
    }
  }

  const [formData, setFormData] = useState(normalizeProfile())

  // Sync form data when profile/user data changes (don't trigger onChange to avoid loop)
  useEffect(() => {
    const normalized = normalizeProfile()
    setFormData(normalized)
  }, [profile, user])

  const updateField = (field: string, value: any) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onChange(newData)
  }

  const addExperience = () => {
    const newExp = {
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      bullets: [""],
      order: formData.experiences.length,
    }
    updateField("experiences", [...formData.experiences, newExp])
  }

  const updateExperience = (index: number, field: string, value: any) => {
    const updated = [...formData.experiences]
    updated[index] = { ...updated[index], [field]: value }
    updateField("experiences", updated)
  }

  const addBullet = (expIndex: number) => {
    const updated = [...formData.experiences]
    updated[expIndex].bullets = [...updated[expIndex].bullets, ""]
    updateField("experiences", updated)
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...formData.experiences]
    updated[expIndex].bullets = updated[expIndex].bullets.filter((_: any, i: number) => i !== bulletIndex)
    updateField("experiences", updated)
  }

  const removeExperience = (index: number) => {
    updateField("experiences", formData.experiences.filter((_: any, i: number) => i !== index))
  }

  const addEducation = () => {
    const newEdu = {
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      grade: "",
      order: formData.education.length,
    }
    updateField("education", [...formData.education, newEdu])
  }

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...formData.education]
    updated[index] = { ...updated[index], [field]: value }
    updateField("education", updated)
  }

  const removeEducation = (index: number) => {
    updateField("education", formData.education.filter((_: any, i: number) => i !== index))
  }

  const addSkill = () => {
    const newSkill = {
      name: "",
      category: "",
      order: formData.skills.length,
    }
    updateField("skills", [...formData.skills, newSkill])
  }

  const updateSkill = (index: number, field: string, value: string) => {
    const updated = [...formData.skills]
    updated[index] = { ...updated[index], [field]: value }
    updateField("skills", updated)
  }

  const removeSkill = (index: number) => {
    updateField("skills", formData.skills.filter((_: any, i: number) => i !== index))
  }

  const addLanguage = () => {
    const newLang = {
      name: "",
      level: "B2",
      order: formData.languages.length,
    }
    updateField("languages", [...formData.languages, newLang])
  }

  const updateLanguage = (index: number, field: string, value: string) => {
    const updated = [...formData.languages]
    updated[index] = { ...updated[index], [field]: value }
    updateField("languages", updated)
  }

  const removeLanguage = (index: number) => {
    updateField("languages", formData.languages.filter((_: any, i: number) => i !== index))
  }

  const addCertification = () => {
    const newCert = {
      name: "",
      issuer: "",
      year: null,
      order: formData.certifications.length,
    }
    updateField("certifications", [...formData.certifications, newCert])
  }

  const updateCertification = (index: number, field: string, value: any) => {
    const updated = [...formData.certifications]
    updated[index] = { ...updated[index], [field]: value }
    updateField("certifications", updated)
  }

  const removeCertification = (index: number) => {
    updateField("certifications", formData.certifications.filter((_: any, i: number) => i !== index))
  }

  return (
    <div className="space-y-8">
      {/* Persönliche Informationen */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Persönliche Informationen</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Vorname</label>
            <Input
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Nachname</label>
            <Input
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Tagline</label>
            <Input
              value={formData.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              placeholder="z.B. Senior Consultant"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">E-Mail</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Telefon</label>
            <Input
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Stadt</label>
            <Input
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Land</label>
            <Input
              value={formData.country}
              onChange={(e) => updateField("country", e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">LinkedIn URL</label>
            <Input
              value={formData.linkedInUrl}
              onChange={(e) => updateField("linkedInUrl", e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
      </section>

      {/* Profil/Zusammenfassung */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Profil</h2>
        <Textarea
          value={formData.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          placeholder="3-5 Sätze über dich..."
          rows={5}
        />
      </section>

      {/* Berufserfahrung */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Berufserfahrung</h2>
          <Button type="button" onClick={addExperience} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Station hinzufügen
          </Button>
        </div>
        <div className="space-y-6">
          {formData.experiences.map((exp: any, expIndex: number) => (
            <div key={expIndex} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Jobtitel</label>
                  <Input
                    value={exp.jobTitle}
                    onChange={(e) => updateExperience(expIndex, "jobTitle", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Firma</label>
                  <Input
                    value={exp.company}
                    onChange={(e) => updateExperience(expIndex, "company", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ort</label>
                  <Input
                    value={exp.location}
                    onChange={(e) => updateExperience(expIndex, "location", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Startdatum</label>
                  <Input
                    type="month"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(expIndex, "startDate", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Enddatum</label>
                  <Input
                    type="month"
                    value={exp.endDate || ""}
                    onChange={(e) => updateExperience(expIndex, "endDate", e.target.value)}
                    disabled={exp.isCurrent}
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={exp.isCurrent}
                      onChange={(e) => updateExperience(expIndex, "isCurrent", e.target.checked)}
                    />
                    <span className="text-sm">Aktuelle Position</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Bullet Points</label>
                {exp.bullets.map((bullet: string, bulletIndex: number) => (
                  <div key={bulletIndex} className="flex gap-2 mb-2">
                    <Input
                      value={bullet}
                      onChange={(e) => {
                        const updated = [...exp.bullets]
                        updated[bulletIndex] = e.target.value
                        updateExperience(expIndex, "bullets", updated)
                      }}
                      placeholder="Bullet Point..."
                    />
                    {exp.bullets.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBullet(expIndex, bulletIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addBullet(expIndex)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Bullet hinzufügen
                </Button>
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeExperience(expIndex)}
              >
                <X className="h-4 w-4 mr-2" />
                Station entfernen
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Ausbildung */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ausbildung</h2>
          <Button type="button" onClick={addEducation} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ausbildung hinzufügen
          </Button>
        </div>
        <div className="space-y-4">
          {formData.education.map((edu: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Abschluss</label>
                <Input
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, "degree", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Institution</label>
                <Input
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, "institution", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Ort</label>
                <Input
                  value={edu.location}
                  onChange={(e) => updateEducation(index, "location", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Startjahr</label>
                <Input
                  type="number"
                  value={edu.startDate || ""}
                  onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Endjahr</label>
                <Input
                  type="number"
                  value={edu.endDate || ""}
                  onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Note</label>
                <Input
                  value={edu.grade || ""}
                  onChange={(e) => updateEducation(index, "grade", e.target.value)}
                  placeholder="z.B. magna cum laude"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeEducation(index)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Zertifizierungen */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Zertifizierungen</h2>
          <Button type="button" onClick={addCertification} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Zertifizierung hinzufügen
          </Button>
        </div>
        <div className="space-y-4">
          {formData.certifications.map((cert: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={cert.name}
                  onChange={(e) => updateCertification(index, "name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Aussteller</label>
                <Input
                  value={cert.issuer || ""}
                  onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Jahr</label>
                <Input
                  type="number"
                  value={cert.year || ""}
                  onChange={(e) => updateCertification(index, "year", parseInt(e.target.value) || null)}
                />
              </div>
              <div className="col-span-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeCertification(index)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sprachen */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Sprachen</h2>
          <Button type="button" onClick={addLanguage} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Sprache hinzufügen
          </Button>
        </div>
        <div className="space-y-4">
          {formData.languages.map((lang: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Sprache</label>
                <Input
                  value={lang.name}
                  onChange={(e) => updateLanguage(index, "name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Niveau</label>
                <select
                  value={lang.level}
                  onChange={(e) => updateLanguage(index, "level", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="Muttersprache">Muttersprache</option>
                  <option value="C2">C2</option>
                  <option value="C1">C1</option>
                  <option value="B2">B2</option>
                  <option value="B1">B1</option>
                  <option value="A2">A2</option>
                  <option value="A1">A1</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeLanguage(index)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Kompetenzen */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Kompetenzen</h2>
          <Button type="button" onClick={addSkill} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Skill hinzufügen
          </Button>
        </div>
        <div className="space-y-4">
          {formData.skills.map((skill: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Kategorie</label>
                <Input
                  value={skill.category}
                  onChange={(e) => updateSkill(index, "category", e.target.value)}
                  placeholder="z.B. Strategieentwicklung"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Skill</label>
                <div className="flex gap-2">
                  <Input
                    value={skill.name}
                    onChange={(e) => updateSkill(index, "name", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => removeSkill(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

