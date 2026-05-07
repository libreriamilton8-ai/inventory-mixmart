function isSafeRelativePath(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

function readRedirectTo(formData: FormData, fallbackPath: string) {
  const value = formData.get("redirectTo");

  if (typeof value === "string" && isSafeRelativePath(value)) {
    return value;
  }

  return fallbackPath;
}

export function actionRedirectPath(
  formData: FormData,
  fallbackPath: string,
  params: Record<string, string>,
) {
  const base = readRedirectTo(formData, fallbackPath);
  const [pathname, query = ""] = base.split("?", 2);
  const searchParams = new URLSearchParams(query);

  if ("success" in params) {
    searchParams.delete("error");
  }
  if ("error" in params) {
    searchParams.delete("success");
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    } else {
      searchParams.delete(key);
    }
  });

  const nextQuery = searchParams.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
