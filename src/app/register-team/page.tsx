"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { API_URL, type Category, type Player, type Season, type Team } from "@/lib/api";

type TeamForm = {
  name: string;
  city: string;
  coachName: string;
  assistantCoachName: string;
  doctor: string;
  ageCategory: string;
  season: string;
};

type PlayerForm = {
  firstName: string;
  lastName: string;
  number: string;
  position: string;
  birthDate: string;
  height: string;
};

type TeamErrors = Partial<Record<keyof TeamForm, string>>;
type PlayerErrors = Partial<Record<keyof PlayerForm, string>>;

const emptyTeamForm: TeamForm = {
  name: "",
  city: "",
  coachName: "",
  assistantCoachName: "",
  doctor: "",
  ageCategory: "",
  season: "",
};

const emptyPlayerForm: PlayerForm = {
  firstName: "",
  lastName: "",
  number: "",
  position: "",
  birthDate: "",
  height: "",
};

export default function RegisterTeamPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayerForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [teamLogoKey, setTeamLogoKey] = useState("");
  const [teamLogoPreview, setTeamLogoPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamErrors, setTeamErrors] = useState<TeamErrors>({});
  const [playerErrors, setPlayerErrors] = useState<PlayerErrors>({});

  const inputClassName =
    "mt-2 w-full rounded-xl border border-zinc-300/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-400 focus:border-[#00306d] focus:ring-4 focus:ring-[#00306d]/15";
  const selectClassName =
    "mt-2 w-full rounded-xl border border-zinc-300/90 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition hover:border-zinc-400 focus:border-[#00306d] focus:ring-4 focus:ring-[#00306d]/15";
  const sectionCardClassName =
    "rounded-2xl border border-zinc-200/80 bg-white/95 p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur sm:p-7";
  const getFieldClassName = (baseClassName: string, hasError: boolean) =>
    hasError
      ? `${baseClassName} border-red-500/90 hover:border-red-500 focus:border-red-500 focus:ring-red-100`
      : baseClassName;
  const errorTextClassName = "mt-1 block text-xs font-medium text-red-600";

  const validateTeamForm = () => {
    const nextErrors: TeamErrors = {};
    if (!teamForm.name.trim()) nextErrors.name = "გთხოვთ შეიყვანოთ გუნდის სახელი";
    if (!teamForm.ageCategory) nextErrors.ageCategory = "გთხოვთ აირჩიოთ ასაკობრივი კატეგორია";
    if (!teamForm.season) nextErrors.season = "გთხოვთ აირჩიოთ სეზონი";
    return nextErrors;
  };

  const validatePlayerForm = () => {
    const nextErrors: PlayerErrors = {};
    if (!playerForm.firstName.trim()) nextErrors.firstName = "გთხოვთ შეიყვანოთ მოთამაშის სახელი";
    if (!playerForm.lastName.trim()) nextErrors.lastName = "გთხოვთ შეიყვანოთ მოთამაშის გვარი";
    if (!playerForm.number.trim()) {
      nextErrors.number = "გთხოვთ შეიყვანოთ მოთამაშის ნომერი";
    } else {
      const parsedNumber = Number(playerForm.number);
      if (Number.isNaN(parsedNumber) || parsedNumber < 0 || parsedNumber > 99) {
        nextErrors.number = "მოთამაშის ნომერი უნდა იყოს 0-99 დიაპაზონში";
      }
    }
    return nextErrors;
  };

  useEffect(() => {
    const load = async () => {
      setIsLoadingCategories(true);
      try {
        const res = await fetch(`${API_URL}/categories`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("კატეგორიების წამოღება ვერ მოხერხდა");
        const data = (await res.json()) as Category[];
        setCategories(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "კატეგორიების ჩატვირთვა ვერ მოხერხდა";
        setError(message);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadSeasons = async () => {
      setIsLoadingSeasons(true);
      try {
        const query = teamForm.ageCategory ? `?ageCategory=${encodeURIComponent(teamForm.ageCategory)}` : "";
        const res = await fetch(`${API_URL}/seasons${query}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("სეზონების წამოღება ვერ მოხერხდა");
        const data = (await res.json()) as Season[];
        setSeasons(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : "სეზონების ჩატვირთვა ვერ მოხერხდა";
        setError(message);
      } finally {
        setIsLoadingSeasons(false);
      }
    };

    void loadSeasons();
  }, [teamForm.ageCategory]);

  const createTeam = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const nextTeamErrors = validateTeamForm();
    setTeamErrors(nextTeamErrors);
    if (Object.keys(nextTeamErrors).length > 0) return;
    setIsSavingTeam(true);
    try {
      const payload = {
        name: teamForm.name.trim(),
        city: teamForm.city.trim(),
        coachName: teamForm.coachName.trim(),
        assistantCoachName: teamForm.assistantCoachName.trim(),
        doctor: teamForm.doctor.trim(),
        ageCategory: teamForm.ageCategory,
        season: teamForm.season,
        logo: teamLogoUrl || undefined,
        logoKey: teamLogoKey || undefined,
      };
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as Team | { message?: string };
      if (!res.ok) {
        const message =
          typeof data === "object" && data && "message" in data && data.message
            ? data.message
            : "გუნდის შექმნა ვერ მოხერხდა";
        throw new Error(message);
      }
      setCreatedTeam(data as Team);
      setPlayers([]);
      setCurrentStep(2);
      setSuccess("გუნდი წარმატებით დარეგისტრირდა. ახლა დაამატეთ მოთამაშეები.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "გუნდის შექმნა ვერ მოხერხდა";
      setError(message);
    } finally {
      setIsSavingTeam(false);
    }
  };

  const uploadTeamLogo = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSuccess(null);
    setIsUploadingLogo(true);
    try {
      if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) {
        throw new Error("ლოგოს ტიპი უნდა იყოს png, jpg ან webp");
      }

      const signedRes = await fetch(`${API_URL}/upload-url?type=${encodeURIComponent(file.type)}`, {
        headers: { "Content-Type": "application/json" },
      });
      const signedData = (await signedRes.json()) as
        | { uploadUrl: string; fileUrl: string; key: string; message?: string }
        | { message?: string };
      if (!signedRes.ok || !("uploadUrl" in signedData)) {
        const message =
          typeof signedData === "object" && signedData && "message" in signedData && signedData.message
            ? signedData.message
            : "ლოგოს ატვირთვის ლინკის მიღება ვერ მოხერხდა";
        throw new Error(message);
      }

      const uploadRes = await fetch(signedData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("ლოგოს ატვირთვა ვერ მოხერხდა");

      setTeamLogoUrl(signedData.fileUrl);
      setTeamLogoKey(signedData.key);
      setTeamLogoPreview(URL.createObjectURL(file));
      setSuccess("გუნდის ლოგო აიტვირთა.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "ლოგოს ატვირთვა ვერ მოხერხდა";
      setError(message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const addPlayer = async (event: FormEvent) => {
    event.preventDefault();
    if (!createdTeam?._id) return;
    setError(null);
    setSuccess(null);
    const nextPlayerErrors = validatePlayerForm();
    setPlayerErrors(nextPlayerErrors);
    if (Object.keys(nextPlayerErrors).length > 0) return;
    setIsSavingPlayer(true);
    try {
      const payload = {
        firstName: playerForm.firstName.trim(),
        lastName: playerForm.lastName.trim(),
        number: Number(playerForm.number),
        position: playerForm.position.trim(),
        birthDate: playerForm.birthDate || undefined,
        height: playerForm.height ? Number(playerForm.height) : undefined,
        teamId: createdTeam._id,
      };

      const res = await fetch(`${API_URL}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as Player | { message?: string };
      if (!res.ok) {
        const message =
          typeof data === "object" && data && "message" in data && data.message
            ? data.message
            : "მოთამაშის დამატება ვერ მოხერხდა";
        throw new Error(message);
      }
      setPlayers((prev) => [...prev, data as Player]);
      setPlayerForm(emptyPlayerForm);
      setPlayerErrors({});
      setSuccess("მოთამაშე დაემატა. ფოტო მოგვიანებით შეუძლია ადმინისტრატორს დაამატოს.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "მოთამაშის დამატება ვერ მოხერხდა";
      setError(message);
    } finally {
      setIsSavingPlayer(false);
    }
  };

  const submitRegistrationRequest = () => {
    setError(null);
    if (!createdTeam?._id) {
      setError("ჯერ შექმენით გუნდი.");
      return;
    }
    if (players.length === 0) {
      setError("რეგისტრაციის გასაგზავნად მინიმუმ ერთი მოთამაშე დაამატეთ.");
      return;
    }
    setCurrentStep(3);
    setSuccess("რეგისტრაციის მოთხოვნა წარმატებით გაიგზავნა.");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="arial-caps text-2xl font-semibold text-zinc-900">გუნდის რეგისტრაცია</h1>
        <p className="mt-2 dejavu-sans text-sm text-zinc-600">
          შეავსეთ გუნდის ინფორმაცია და შემდეგ დაამატეთ მოთამაშეები. მოთამაშის ფოტო სავალდებულო არ არის.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm font-medium text-red-700 shadow-sm">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-sm font-medium text-emerald-700 shadow-sm">
          {success}
        </p>
      )}

      <section className="mb-6 rounded-2xl border border-zinc-200/80 bg-white/95 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { id: 1, title: "გუნდის შექმნა" },
            { id: 2, title: "მოთამაშეები" },
            { id: 3, title: "დადასტურება" },
          ].map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  isActive
                    ? "border-[#00306d]/30 bg-[#00306d]/5"
                    : isDone
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-[#00306d] text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {step.id}
                </span>
                <span className="dejavu-sans text-sm text-zinc-800">{step.title}</span>
              </div>
            );
          })}
        </div>
      </section>

      {currentStep === 1 && (
        <section className={sectionCardClassName}>
        <h2 className="arial-caps mb-1 text-lg font-semibold text-zinc-900">1) გუნდის ინფორმაცია</h2>
        <p className="mb-5 dejavu-sans text-xs text-zinc-500">აუცილებელი ველები მონიშნულია ვარსკვლავით (*).</p>
        <form onSubmit={createTeam} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="dejavu-sans text-sm text-zinc-700">
            გუნდის სახელი *
            <input
              placeholder="მაგ: Kidscup თბილისი"
              value={teamForm.name}
              onChange={(e) => {
                setTeamForm((prev) => ({ ...prev, name: e.target.value }));
                setTeamErrors((prev) => ({ ...prev, name: undefined }));
              }}
              className={getFieldClassName(inputClassName, Boolean(teamErrors.name))}
            />
            {teamErrors.name && <span className={errorTextClassName}>{teamErrors.name}</span>}
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            ქალაქი
            <input
              placeholder="მაგ: თბილისი"
              value={teamForm.city}
              onChange={(e) => setTeamForm((prev) => ({ ...prev, city: e.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            მთავარი მწვრთნელი
            <input
              placeholder="სახელი და გვარი"
              value={teamForm.coachName}
              onChange={(e) => setTeamForm((prev) => ({ ...prev, coachName: e.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            ასისტენტი მწვრთნელი (არასავალდებულო)
            <input
              placeholder="სახელი და გვარი"
              value={teamForm.assistantCoachName}
              onChange={(e) => setTeamForm((prev) => ({ ...prev, assistantCoachName: e.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            ექიმი (არასავალდებულო)
            <input
              placeholder="სახელი და გვარი"
              value={teamForm.doctor}
              onChange={(e) => setTeamForm((prev) => ({ ...prev, doctor: e.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            ასაკობრივი კატეგორია *
            <select
              value={teamForm.ageCategory}
              onChange={(e) => {
                setTeamForm((prev) => ({ ...prev, ageCategory: e.target.value, season: "" }));
                setTeamErrors((prev) => ({ ...prev, ageCategory: undefined, season: undefined }));
              }}
              className={getFieldClassName(selectClassName, Boolean(teamErrors.ageCategory))}
            >
              <option value="">{isLoadingCategories ? "იტვირთება..." : "აირჩიეთ კატეგორია"}</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {teamErrors.ageCategory && <span className={errorTextClassName}>{teamErrors.ageCategory}</span>}
          </label>

            <label className="dejavu-sans text-sm text-zinc-700">
            სეზონი *
            <select
              value={teamForm.season}
              onChange={(e) => {
                setTeamForm((prev) => ({ ...prev, season: e.target.value }));
                setTeamErrors((prev) => ({ ...prev, season: undefined }));
              }}
              className={getFieldClassName(selectClassName, Boolean(teamErrors.season))}
            >
              <option value="">
                {isLoadingSeasons
                  ? "იტვირთება..."
                  : seasons.length === 0
                    ? "სეზონები არ მოიძებნა"
                    : "აირჩიეთ სეზონი"}
              </option>
              {seasons.map((season) => (
                <option key={season._id} value={season._id}>
                  {season.name}
                </option>
              ))}
            </select>
            {teamErrors.season && <span className={errorTextClassName}>{teamErrors.season}</span>}
          </label>

          <label className="dejavu-sans text-sm text-zinc-700">
            გუნდის ლოგო
            <input
              id="team-logo-upload"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => void uploadTeamLogo(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <label
              htmlFor="team-logo-upload"
              className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 p-3 text-zinc-700 transition hover:border-[#00306d]/50 hover:bg-[#00306d]/5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                <ImagePlus className="h-5 w-5 text-[#00306d]" />
              </span>
              <span className="dejavu-sans text-sm">
                {isUploadingLogo ? "ლოგო იტვირთება..." : "დააჭირე და ატვირთე გუნდის ლოგო"}
              </span>
            </label>
            <span className="mt-1 block text-xs text-zinc-500">
              {isUploadingLogo
                ? "ლოგო იტვირთება..."
                : teamLogoKey
                  ? `ატვირთულია: ${teamLogoKey}`
                  : "მხარდაჭერილი ფორმატები: png, jpg, webp"}
            </span>
            {teamLogoPreview && (
              <Image
                src={teamLogoPreview}
                alt="Team logo preview"
                width={80}
                height={80}
                unoptimized
                className="mt-2 h-20 w-20 rounded-md border border-zinc-200 object-cover"
              />
            )}
          </label>

          <div className="sm:col-span-2">
            <button
              disabled={isSavingTeam || isUploadingLogo}
              type="submit"
              className="rounded-md dejavu-sans cursor-pointer bg-[#00306d] px-5 py-2.5 text-sm font-normal text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#002554] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingTeam ? "ინახება..." : "გუნდის შექმნა"}
            </button>
          </div>
        </form>
      </section>
      )}

      {currentStep === 2 && createdTeam && (
        <section className={`mt-6 ${sectionCardClassName}`}>
          <h2 className="arial-caps mb-1 text-lg font-semibold text-zinc-900">2) მოთამაშეები</h2>
          <p className="mb-4 text-sm text-zinc-600 dejavu-sans">
            გუნდი: <span className="font-semibold text-zinc-800">{createdTeam.name}</span>
          </p>

          <form onSubmit={addPlayer} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="dejavu-sans text-sm text-zinc-700">
              სახელი *
              <input
                placeholder="სახელი"
                value={playerForm.firstName}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, firstName: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                className={getFieldClassName(inputClassName, Boolean(playerErrors.firstName))}
              />
              {playerErrors.firstName && <span className={errorTextClassName}>{playerErrors.firstName}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              გვარი *
              <input
                placeholder="გვარი"
                value={playerForm.lastName}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, lastName: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                className={getFieldClassName(inputClassName, Boolean(playerErrors.lastName))}
              />
              {playerErrors.lastName && <span className={errorTextClassName}>{playerErrors.lastName}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              ნომერი *
              <input
                min={0}
                max={99}
                type="number"
                value={playerForm.number}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, number: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, number: undefined }));
                }}
                className={getFieldClassName(inputClassName, Boolean(playerErrors.number))}
              />
              {playerErrors.number && <span className={errorTextClassName}>{playerErrors.number}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              პოზიცია (არასავალდებულო)
              <select
                value={playerForm.position}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, position: e.target.value }))}
                className={selectClassName}
              >
                <option value="">აირჩიეთ (არასავალდებულო)</option>
                <option value="PG">PG</option>
                <option value="SG">SG</option>
                <option value="SF">SF</option>
                <option value="PF">PF</option>
                <option value="C">C</option>
              </select>
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              დაბადების თარიღი
              <input
                type="date"
                value={playerForm.birthDate}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, birthDate: e.target.value }))}
                className={inputClassName}
              />
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              სიმაღლე (სმ)
              <input
                min={0}
                type="number"
                value={playerForm.height}
                onChange={(e) => setPlayerForm((prev) => ({ ...prev, height: e.target.value }))}
                className={inputClassName}
              />
            </label>

            <div className="sm:col-span-3">
              <button
                disabled={isSavingPlayer}
                type="submit"
                className="rounded-xl bg-[#fd7209] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e56203] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingPlayer ? "ინახება..." : "მოთამაშის დამატება"}
              </button>
            </div>
          </form>

          <div className="mt-5">
            {players.length === 0 ? (
              <p className="text-sm text-zinc-600 dejavu-sans">მოთამაშეები ჯერ არ არის დამატებული.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                  <article key={player._id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    <h3 className="font-semibold text-zinc-900">
                      {player.firstName} {player.lastName}
                    </h3>
                    <div className="mt-2 space-y-1 text-sm text-zinc-700">
                      <p>#{player.number}</p>
                      <p>პოზიცია: {player.position || "—"}</p>
                      <p>ფოტო: არა (ადმინი დაამატებს)</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitRegistrationRequest}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Registration request
            </button>
          </div>
        </section>
      )}

      {currentStep === 3 && createdTeam && (
        <section className={`mt-6 ${sectionCardClassName}`}>
          <h2 className="arial-caps mb-2 text-lg font-semibold text-zinc-900">3) რეგისტრაცია დასრულდა</h2>
          <p className="dejavu-sans mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            თქვენი გუნდის რეგისტრაციის მოთხოვნა წარმატებით გაიგზავნა.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">გუნდის ინფორმაცია</h3>
              <p className="text-sm text-zinc-700">სახელი: {createdTeam.name}</p>
              <p className="text-sm text-zinc-700">ქალაქი: {createdTeam.city || "—"}</p>
              <p className="text-sm text-zinc-700">მთავარი მწვრთნელი: {createdTeam.coachName || "—"}</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">მოთამაშეები</h3>
              <p className="text-sm text-zinc-700">სულ დამატებული: {players.length}</p>
              <div className="mt-2 space-y-1 text-sm text-zinc-700">
                {players.map((player) => (
                  <p key={player._id}>
                    #{player.number} - {player.firstName} {player.lastName}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
