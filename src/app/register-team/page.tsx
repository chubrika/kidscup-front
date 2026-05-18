"use client";

import { FormEvent, useEffect, useLayoutEffect, useState } from "react";
import { BirthDatePicker } from "@/components/BirthDatePicker";
import { AddedPlayersList } from "@/app/register-team/AddedPlayersList";
import { ImageUploadField } from "@/app/register-team/ImageUploadField";
import { API_URL, type Category, type Player, type Season, type Team } from "@/lib/api";
import { PLAYER_POSITIONS, toBirthDateInputValue } from "@/app/register-team/utils";

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
  photo: string;
  photoKey: string;
  idDocument: string;
  idDocumentKey: string;
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
  photo: "",
  photoKey: "",
  idDocument: "",
  idDocumentKey: "",
};

const ACCEPTED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"] as const;
const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const REGISTER_TEAM_STORAGE_KEY = "kidscup-register-team";

type StoredRegistration = {
  team: Team;
  players: Player[];
  step: 1 | 2 | 3;
};

const readStoredRegistration = (): StoredRegistration | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REGISTER_TEAM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredRegistration;
    if (!parsed?.team?._id) return null;
    return {
      team: parsed.team,
      players: Array.isArray(parsed.players) ? parsed.players : [],
      step: parsed.step === 3 ? 3 : parsed.step === 2 ? 2 : 1,
    };
  } catch {
    return null;
  }
};

const writeStoredRegistration = (data: StoredRegistration | null) => {
  if (typeof window === "undefined") return;
  if (!data) {
    localStorage.removeItem(REGISTER_TEAM_STORAGE_KEY);
    return;
  }
  localStorage.setItem(REGISTER_TEAM_STORAGE_KEY, JSON.stringify(data));
};

export default function RegisterTeamPage() {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [teamForm, setTeamForm] = useState<TeamForm>(emptyTeamForm);
  const [playerForm, setPlayerForm] = useState<PlayerForm>(emptyPlayerForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [createdTeam, setCreatedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [teamLogoUrl, setTeamLogoUrl] = useState("");
  const [teamLogoKey, setTeamLogoKey] = useState("");
  const [teamLogoPreview, setTeamLogoPreview] = useState("");
  const [isUploadingPlayerPhoto, setIsUploadingPlayerPhoto] = useState(false);
  const [playerPhotoPreview, setPlayerPhotoPreview] = useState("");
  const [isUploadingIdDocument, setIsUploadingIdDocument] = useState(false);
  const [idDocumentPreview, setIdDocumentPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamErrors, setTeamErrors] = useState<TeamErrors>({});
  const [playerErrors, setPlayerErrors] = useState<PlayerErrors>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  const sectionCardClassName =
    "rounded-2xl border border-[#e8e2da] bg-white p-5 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.28)] sm:p-7";
  const fieldClassName =
    "mt-2 w-full rounded-xl border border-[#e8e2da] bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-[#d9d0c6] focus:border-[#fd7209] focus:ring-4 focus:ring-[#fd7209]/15";
  const selectClassName =
    "mt-2 w-full appearance-none rounded-xl border border-[#e8e2da] bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition hover:border-[#d9d0c6] focus:border-[#fd7209] focus:ring-4 focus:ring-[#fd7209]/15";
  const primaryButtonClassName =
    "rounded-xl bg-[#fd7209] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(253,114,9,0.9)] transition hover:-translate-y-0.5 hover:bg-[#e56203] disabled:cursor-not-allowed disabled:opacity-70";
  const getFieldClassName = (baseClassName: string, hasError: boolean) =>
    hasError
      ? `${baseClassName} border-red-500/90 hover:border-red-500 focus:border-red-500 focus:ring-red-100`
      : baseClassName;
  const errorTextClassName = "mt-1 block text-xs font-medium text-red-600";
  const requiredMark = <span className="text-red-500">*</span>;
  const resetPlayerFormState = () => {
    setPlayerForm(emptyPlayerForm);
    setPlayerErrors({});
    setEditingPlayerId(null);
    if (playerPhotoPreview && playerPhotoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(playerPhotoPreview);
    }
    setPlayerPhotoPreview("");
    if (idDocumentPreview && idDocumentPreview.startsWith("blob:")) {
      URL.revokeObjectURL(idDocumentPreview);
    }
    setIdDocumentPreview("");
  };

  const persistRegistration = (team: Team, nextPlayers: Player[], step: 1 | 2 | 3) => {
    writeStoredRegistration({ team, players: nextPlayers, step });
  };

  const clearRegistrationSession = () => {
    writeStoredRegistration(null);
    setCreatedTeam(null);
    setPlayers([]);
    setCurrentStep(1);
    setTeamForm(emptyTeamForm);
    resetPlayerFormState();
    setTeamLogoUrl("");
    setTeamLogoKey("");
    if (teamLogoPreview) URL.revokeObjectURL(teamLogoPreview);
    setTeamLogoPreview("");
    if (playerPhotoPreview) URL.revokeObjectURL(playerPhotoPreview);
    setPlayerPhotoPreview("");
    if (idDocumentPreview) URL.revokeObjectURL(idDocumentPreview);
    setIdDocumentPreview("");
    setError(null);
    setSuccess(null);
  };

  useLayoutEffect(() => {
    const stored = readStoredRegistration();
    if (stored?.team) {
      setCreatedTeam(stored.team);
      setPlayers(stored.players);
      setCurrentStep(stored.step >= 2 ? stored.step : 2);
      if (stored.step >= 2) {
        setSuccess("გაგრძელება შენახული რეგისტრაციიდან.");
      }
    }
    setIsSessionReady(true);
  }, []);

  const validateTeamForm = () => {
    const nextErrors: TeamErrors = {};
    if (!teamForm.name.trim()) nextErrors.name = "გთხოვთ შეიყვანოთ გუნდის სახელი";
    if (!teamForm.ageCategory) nextErrors.ageCategory = "გთხოვთ აირჩიოთ ასაკობრივი კატეგორია";
    if (!teamForm.season) {
      nextErrors.season =
        teamForm.ageCategory && seasons.length === 0
          ? "ამ კატეგორიისთვის სეზონი არ მოიძებნა"
          : "სეზონი ვერ მოიძებნა";
    }
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
    if (!playerForm.birthDate.trim()) {
      nextErrors.birthDate = "გთხოვთ აირჩიოთ დაბადების თარიღი";
    }
    if (!playerForm.position.trim()) {
      nextErrors.position = "გთხოვთ აირჩიოთ პოზიცია";
    }
    const hasPhoto = Boolean(playerForm.photoKey.trim() || playerForm.photo.trim());
    const hasIdDocument = Boolean(playerForm.idDocumentKey.trim() || playerForm.idDocument.trim());
    if (!hasPhoto) {
      nextErrors.photoKey = "გთხოვთ ატვირთოთ მოთამაშის ფოტო";
    }
    if (!hasIdDocument) {
      nextErrors.idDocumentKey = "გთხოვთ ატვირთოთ პირადობის ან დაბადების მოწმობის ფოტო";
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
      if (!teamForm.ageCategory) {
        setSeasons([]);
        setTeamForm((prev) => ({ ...prev, season: "" }));
        return;
      }
      try {
        const query = `?ageCategory=${encodeURIComponent(teamForm.ageCategory)}`;
        const res = await fetch(`${API_URL}/seasons${query}`, {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("სეზონების წამოღება ვერ მოხერხდა");
        const data = (await res.json()) as Season[];
        setSeasons(data);
        setTeamForm((prev) => ({
          ...prev,
          season: data.length > 0 ? data[0]._id : "",
        }));
        setTeamErrors((prev) => ({ ...prev, season: undefined }));
      } catch (e) {
        const message = e instanceof Error ? e.message : "სეზონების ჩატვირთვა ვერ მოხერხდა";
        setError(message);
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
      const team = data as Team;
      setCreatedTeam(team);
      setPlayers([]);
      setCurrentStep(2);
      persistRegistration(team, [], 2);
      setSuccess(
        "გუნდი შექმნილია და ელოდება ადმინისტრატორის დამტკიცებას. საიტზე გამოჩნდება დამტკიცების შემდეგ. ახლა დაამატეთ მოთამაშეები.",
      );
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

  const uploadPlayerPhoto = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
      setError("მოთამაშის ფოტოს ტიპი უნდა იყოს png, jpg ან webp");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("მოთამაშის ფოტოს ზომა არ უნდა აღემატებოდეს 4MB-ს");
      return;
    }

    setIsUploadingPlayerPhoto(true);
    try {
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
            : "ფოტოს ატვირთვის ლინკის მიღება ვერ მოხერხდა";
        throw new Error(message);
      }

      const uploadRes = await fetch(signedData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("მოთამაშის ფოტოს ატვირთვა ვერ მოხერხდა");

      if (playerPhotoPreview) URL.revokeObjectURL(playerPhotoPreview);
      const previewUrl = URL.createObjectURL(file);
      setPlayerPhotoPreview(previewUrl);
      setPlayerForm((prev) => ({
        ...prev,
        photo: signedData.fileUrl,
        photoKey: signedData.key,
      }));
      setSuccess("მოთამაშის ფოტო აიტვირთა. ახლა შეიყვანეთ მონაცემები და დაამატეთ მოთამაშე.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "მოთამაშის ფოტოს ატვირთვა ვერ მოხერხდა";
      setError(message);
    } finally {
      setIsUploadingPlayerPhoto(false);
    }
  };

  const removePlayerPhoto = () => {
    if (playerPhotoPreview) URL.revokeObjectURL(playerPhotoPreview);
    setPlayerPhotoPreview("");
    setPlayerForm((prev) => ({ ...prev, photo: "", photoKey: "" }));
  };

  const uploadPlayerIdDocument = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSuccess(null);

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type as (typeof ACCEPTED_PHOTO_TYPES)[number])) {
      setError("დოკუმენტის ფოტოს ტიპი უნდა იყოს png, jpg ან webp");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("დოკუმენტის ფოტოს ზომა არ უნდა აღემატებოდეს 4MB-ს");
      return;
    }

    setIsUploadingIdDocument(true);
    try {
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
            : "დოკუმენტის ატვირთვის ლინკის მიღება ვერ მოხერხდა";
        throw new Error(message);
      }

      const uploadRes = await fetch(signedData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("დოკუმენტის ატვირთვა ვერ მოხერხდა");

      if (idDocumentPreview) URL.revokeObjectURL(idDocumentPreview);
      const previewUrl = URL.createObjectURL(file);
      setIdDocumentPreview(previewUrl);
      setPlayerForm((prev) => ({
        ...prev,
        idDocument: signedData.fileUrl,
        idDocumentKey: signedData.key,
      }));
      setPlayerErrors((prev) => ({ ...prev, idDocumentKey: undefined }));
    } catch (e) {
      const message = e instanceof Error ? e.message : "დოკუმენტის ატვირთვა ვერ მოხერხდა";
      setError(message);
    } finally {
      setIsUploadingIdDocument(false);
    }
  };

  const removePlayerIdDocument = () => {
    if (idDocumentPreview) URL.revokeObjectURL(idDocumentPreview);
    setIdDocumentPreview("");
    setPlayerForm((prev) => ({ ...prev, idDocument: "", idDocumentKey: "" }));
  };

  const buildPlayerPayload = () => ({
    firstName: playerForm.firstName.trim(),
    lastName: playerForm.lastName.trim(),
    number: Number(playerForm.number),
    position: playerForm.position.trim(),
    birthDate: playerForm.birthDate || undefined,
    height: playerForm.height ? Number(playerForm.height) : undefined,
    photo: playerForm.photo || undefined,
    photoKey: playerForm.photoKey || undefined,
    idDocument: playerForm.idDocument || undefined,
    idDocumentKey: playerForm.idDocumentKey || undefined,
    teamId: createdTeam!._id,
  });

  const startEditPlayer = (player: Player) => {
    setError(null);
    setSuccess(null);
    setEditingPlayerId(player._id);
    setPlayerForm({
      firstName: player.firstName,
      lastName: player.lastName,
      number: String(player.number),
      position: player.position ?? "",
      birthDate: toBirthDateInputValue(player.birthDate),
      height: player.height ? String(player.height) : "",
      photo: player.photo ?? "",
      photoKey: "",
      idDocument: player.idDocument ?? "",
      idDocumentKey: "",
    });
    setPlayerPhotoPreview(player.photo ?? "");
    setIdDocumentPreview(player.idDocument ?? "");
    setPlayerErrors({});
  };

  const deletePlayer = async (playerId: string) => {
    if (!createdTeam?._id) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_URL}/players/${playerId}/register`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "მოთამაშის წაშლა ვერ მოხერხდა");
      }
      setPlayers((prev) => {
        const nextPlayers = prev.filter((player) => player._id !== playerId);
        persistRegistration(createdTeam, nextPlayers, 2);
        return nextPlayers;
      });
      if (editingPlayerId === playerId) resetPlayerFormState();
      setSuccess("მოთამაშე წაიშალა.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "მოთამაშის წაშლა ვერ მოხერხდა";
      setError(message);
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
      const payload = buildPlayerPayload();
      const isEditing = Boolean(editingPlayerId);
      const res = await fetch(
        isEditing ? `${API_URL}/players/${editingPlayerId}/register` : `${API_URL}/players`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as Player | { message?: string };
      if (!res.ok) {
        const message =
          typeof data === "object" && data && "message" in data && data.message
            ? data.message
            : isEditing
              ? "მოთამაშის განახლება ვერ მოხერხდა"
              : "მოთამაშის დამატება ვერ მოხერხდა";
        throw new Error(message);
      }
      const savedPlayer = data as Player;
      setPlayers((prev) => {
        const nextPlayers = isEditing
          ? prev.map((player) => (player._id === savedPlayer._id ? savedPlayer : player))
          : [...prev, savedPlayer];
        persistRegistration(createdTeam, nextPlayers, 2);
        return nextPlayers;
      });
      resetPlayerFormState();
      setSuccess(isEditing ? "მოთამაშის მონაცემები განახლდა." : "მოთამაშე დაემატა.");
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : editingPlayerId
            ? "მოთამაშის განახლება ვერ მოხერხდა"
            : "მოთამაშის დამატება ვერ მოხერხდა";
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
    if (createdTeam) persistRegistration(createdTeam, players, 3);
    setSuccess(
      "რეგისტრაციის მოთხოვნა მიღებულია. გუნდი ელოდება ადმინისტრატორის დამტკიცებას — დამტკიცების შემდეგ გამოჩნდება საჯარო საიტზე.",
    );
  };

  if (!isSessionReady) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="dejavu-sans text-sm text-zinc-600">იტვირთება...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="arial-caps text-2xl font-semibold text-zinc-900">გუნდის რეგისტრაცია</h1>
        <p className="mt-2 dejavu-sans text-sm text-zinc-600">
          შეავსეთ გუნდის ინფორმაცია და შემდეგ დაამატეთ მოთამაშეები.
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

      <section className="mb-6 rounded-2xl border border-[#e8e2da] bg-white p-4 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.28)] sm:p-5">
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
                    ? "border-[#fd7209]/30 bg-[#fff8f2]"
                    : isDone
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-[#e8e2da] bg-[#faf9f7]"
                }`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "bg-[#fd7209] text-white"
                      : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-[#eef4fc] text-zinc-600"
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
          <p className="mb-6 dejavu-sans text-xs text-zinc-500">
            აუცილებელი ველები მონიშნულია ვარსკვლავით (*).
          </p>
          <form onSubmit={createTeam} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="dejavu-sans text-sm text-zinc-700">
              გუნდის სახელი {requiredMark}
              <input
                placeholder="მაგ: Kidscup თბილისი"
                value={teamForm.name}
                onChange={(e) => {
                  setTeamForm((prev) => ({ ...prev, name: e.target.value }));
                  setTeamErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={getFieldClassName(fieldClassName, Boolean(teamErrors.name))}
              />
              {teamErrors.name && <span className={errorTextClassName}>{teamErrors.name}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              ქალაქი
              <input
                placeholder="მაგ: თბილისი"
                value={teamForm.city}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, city: e.target.value }))}
                className={fieldClassName}
              />
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              მთავარი მწვრთნელი
              <input
                placeholder="სახელი და გვარი"
                value={teamForm.coachName}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, coachName: e.target.value }))}
                className={fieldClassName}
              />
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              ასისტენტი მწვრთნელი (არასავალდებულო)
              <input
                placeholder="სახელი და გვარი"
                value={teamForm.assistantCoachName}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, assistantCoachName: e.target.value }))}
                className={fieldClassName}
              />
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              ექიმი (არასავალდებულო)
              <input
                placeholder="სახელი და გვარი"
                value={teamForm.doctor}
                onChange={(e) => setTeamForm((prev) => ({ ...prev, doctor: e.target.value }))}
                className={fieldClassName}
              />
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              ასაკობრივი კატეგორია {requiredMark}
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
              {teamErrors.season && <span className={errorTextClassName}>{teamErrors.season}</span>}
            </label>

            <div className="sm:col-span-2">
              <ImageUploadField
                label="გუნდის ლოგო"
                inputId="team-logo-upload"
                previewUrl={teamLogoPreview}
                uploadLabel="ლოგოს ატვირთვა"
                uploadingLabel="ლოგო იტვირთება..."
                changeLabel="ლოგოს შეცვლა"
                previewClassName="h-24 w-24"
                isUploading={isUploadingLogo}
                onFileSelect={(file) => void uploadTeamLogo(file)}
              />
            </div>

            <div className="sm:col-span-2">
              <button
                disabled={isSavingTeam || isUploadingLogo}
                type="submit"
                className={`dejavu-sans ${primaryButtonClassName}`}
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
          <p className="mb-6 text-sm text-zinc-600 dejavu-sans">
            გუნდი: <span className="font-semibold text-zinc-800">{createdTeam.name}</span>
          </p>

          {editingPlayerId && (
            <p className="mb-4 rounded-xl border border-[#fd7209]/25 bg-[#fff8f2] px-3.5 py-2.5 text-sm text-[#c45f08] dejavu-sans">
              მოთამაშის რედაქტირება — შეინახეთ ცვლილებები ან{" "}
              <button
                type="button"
                onClick={resetPlayerFormState}
                className="font-semibold underline underline-offset-2"
              >
                გააუქმეთ
              </button>
            </p>
          )}

          <form onSubmit={addPlayer} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="dejavu-sans text-sm text-zinc-700">
              სახელი {requiredMark}
              <input
                placeholder="სახელი"
                value={playerForm.firstName}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, firstName: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, firstName: undefined }));
                }}
                className={getFieldClassName(fieldClassName, Boolean(playerErrors.firstName))}
              />
              {playerErrors.firstName && <span className={errorTextClassName}>{playerErrors.firstName}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              გვარი {requiredMark}
              <input
                placeholder="გვარი"
                value={playerForm.lastName}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, lastName: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, lastName: undefined }));
                }}
                className={getFieldClassName(fieldClassName, Boolean(playerErrors.lastName))}
              />
              {playerErrors.lastName && <span className={errorTextClassName}>{playerErrors.lastName}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700 sm:col-span-2 lg:col-span-1">
              ნომერი {requiredMark}
              <input
                min={0}
                max={99}
                type="number"
                value={playerForm.number}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, number: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, number: undefined }));
                }}
                className={getFieldClassName(fieldClassName, Boolean(playerErrors.number))}
              />
              {playerErrors.number && <span className={errorTextClassName}>{playerErrors.number}</span>}
            </label>

            <label className="dejavu-sans text-sm text-zinc-700">
              პოზიცია {requiredMark}
              <select
                value={playerForm.position}
                onChange={(e) => {
                  setPlayerForm((prev) => ({ ...prev, position: e.target.value }));
                  setPlayerErrors((prev) => ({ ...prev, position: undefined }));
                }}
                className={getFieldClassName(selectClassName, Boolean(playerErrors.position))}
              >
                <option value="">აირჩიეთ</option>
                {PLAYER_POSITIONS.map((position) => (
                  <option key={position.code} value={position.code}>
                    {position.code} - {position.label}
                  </option>
                ))}
              </select>
              {playerErrors.position && <span className={errorTextClassName}>{playerErrors.position}</span>}
            </label>

            <div className="dejavu-sans text-sm text-zinc-700">
              დაბადების თარიღი {requiredMark}
              <BirthDatePicker
                value={playerForm.birthDate}
                onChange={(birthDate) => {
                  setPlayerForm((prev) => ({ ...prev, birthDate }));
                  setPlayerErrors((prev) => ({ ...prev, birthDate: undefined }));
                }}
                hasError={Boolean(playerErrors.birthDate)}
              />
              {playerErrors.birthDate && (
                <span className={errorTextClassName}>{playerErrors.birthDate}</span>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <ImageUploadField
                label={<>პირადობის / დაბადების მოწმობის ფოტო {requiredMark}</>}
                inputId="player-id-document-upload"
                previewUrl={idDocumentPreview}
                uploadLabel="დოკუმენტის ატვირთვა"
                uploadingLabel="დოკუმენტი იტვირთება..."
                changeLabel="დოკუმენტის შეცვლა"
                previewClassName="h-24 w-32"
                isUploading={isUploadingIdDocument}
                error={playerErrors.idDocumentKey}
                onFileSelect={(file) => void uploadPlayerIdDocument(file)}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <ImageUploadField
                label={<>მოთამაშის ფოტო (მხოლოდ ერთი) {requiredMark}</>}
                inputId="player-photo-upload"
                previewUrl={playerPhotoPreview}
                uploadLabel="ფოტოს ატვირთვა"
                uploadingLabel="ფოტო იტვირთება..."
                changeLabel="ფოტოს შეცვლა"
                previewClassName="h-24 w-24"
                isUploading={isUploadingPlayerPhoto}
                error={playerErrors.photoKey}
                onFileSelect={(file) => void uploadPlayerPhoto(file)}
              />
            </div>

            <div className="sm:col-span-3">
              <button
                disabled={isSavingPlayer || isUploadingPlayerPhoto || isUploadingIdDocument}
                type="submit"
                className={primaryButtonClassName}
              >
                {isSavingPlayer
                  ? "ინახება..."
                  : editingPlayerId
                    ? "მოთამაშის შენახვა"
                    : "მოთამაშის დამატება"}
              </button>
            </div>
          </form>

          <AddedPlayersList
            players={players}
            editingPlayerId={editingPlayerId}
            onEdit={startEditPlayer}
            onDelete={(playerId) => void deletePlayer(playerId)}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={submitRegistrationRequest}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              რეგისტრაციის დასრულება
            </button>
          </div>
        </section>
      )}

      {currentStep === 3 && createdTeam && (
        <section className={`mt-6 ${sectionCardClassName}`}>
          <h2 className="arial-caps mb-2 text-lg font-semibold text-zinc-900">3) რეგისტრაცია დასრულდა</h2>
          <p className="dejavu-sans mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            თქვენი გუნდი მოლოდინშია — ადმინისტრატორი დაუდასტურებს მონაცემებს. დამტკიცების შემდეგ გუნდი გამოჩნდება საიტზე.
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e8e2da] bg-[#faf9f7] p-4">
              <h3 className="mb-2 text-sm font-semibold text-zinc-900">გუნდის ინფორმაცია</h3>
              <p className="text-sm text-zinc-700">სახელი: {createdTeam.name}</p>
              <p className="text-sm text-zinc-700">ქალაქი: {createdTeam.city || "—"}</p>
              <p className="text-sm text-zinc-700">მთავარი მწვრთნელი: {createdTeam.coachName || "—"}</p>
            </div>
            <div className="rounded-xl border border-[#e8e2da] bg-[#faf9f7] p-4">
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

          <div className="mt-6">
            <button
              type="button"
              onClick={clearRegistrationSession}
              className="dejavu-sans rounded-xl border border-[#e8e2da] bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:border-[#d9d0c6] hover:bg-[#faf9f7]"
            >
              ახალი გუნდის რეგისტრაცია
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
