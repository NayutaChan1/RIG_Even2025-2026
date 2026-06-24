/**
 * Proxy endpoint: mosec_desktop -> NuxtJS -> PythonServer (/generate-briefing).
 *
 * The PythonServer already calls the Bluejack Schedule + acad-book APIs itself;
 * it only needs the Bluejack bearer token (returned by the Messier LogOn during
 * flazz-login). This endpoint forwards that token plus the template choice and
 * LINE group link, then streams the generated PPTX binary straight back to the
 * desktop client.
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const pythonBase = (config.pythonServerUrl as string).replace(/\/+$/, '');

    const body = await readBody(event);
    const token: string | undefined = body?.token;
    const templateTypeRaw: string | undefined = body?.template_type;
    const lineGroupLink: string | undefined = body?.line_group_link;
    // Assistant initial (e.g. "FB25-1") + optional class, from the card tap.
    const assistantCode: string | undefined = body?.assistant_code;
    const classCode: string | undefined = body?.class_code;

    if (!token) {
        throw createError({ statusCode: 400, message: 'token (Bluejack bearer) wajib diisi' });
    }

    const templateType = String(templateTypeRaw || '').trim().toLowerCase();
    if (templateType !== 'quiz' && templateType !== 'uap') {
        throw createError({
            statusCode: 400,
            message: `template_type harus 'quiz' atau 'uap', diterima: ${JSON.stringify(templateTypeRaw)}`,
        });
    }

    if (!lineGroupLink) {
        throw createError({ statusCode: 400, message: 'line_group_link wajib diisi' });
    }

    // Forward to the PythonServer. Use native fetch so we can stream the binary.
    let pyResponse: Response;
    try {
        pyResponse = await fetch(`${pythonBase}/generate-briefing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                line_group_link: lineGroupLink,
                template_type: templateType,
                assistant_code: assistantCode,
                class_code: classCode,
            }),
        });
    } catch (err) {
        throw createError({
            statusCode: 502,
            message:
                'Gagal menghubungi PythonServer (PPT generator): ' +
                (err instanceof Error ? err.message : 'Unknown error'),
        });
    }

    if (!pyResponse.ok) {
        // PythonServer returns JSON errors ({ detail: "..." }) on failure.
        let detail = `PythonServer mengembalikan status ${pyResponse.status}`;
        try {
            const errJson = await pyResponse.json();
            if (errJson?.detail) detail = errJson.detail;
        } catch {
            // non-JSON body — keep the generic message
        }
        throw createError({ statusCode: pyResponse.status, message: detail });
    }

    // Pass through the binary + relevant headers.
    const arrayBuffer = await pyResponse.arrayBuffer();
    const filename =
        pyResponse.headers.get('content-disposition')?.match(/filename="?([^"]+)"?/)?.[1] ||
        `Briefing_${templateType}.pptx`;

    setResponseHeaders(event, {
        'Content-Type':
            pyResponse.headers.get('content-type') ||
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Course-Code': pyResponse.headers.get('x-course-code') || '',
        'X-Class-Code': pyResponse.headers.get('x-class-code') || '',
    });

    // Return a Node Buffer so h3 sends it as a raw binary body (not JSON).
    return Buffer.from(arrayBuffer);
});
