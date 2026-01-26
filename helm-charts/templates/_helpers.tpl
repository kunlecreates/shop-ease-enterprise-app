{{- define "umbrella.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "umbrella.fullname" -}}
{{- /* Prefer an explicit fullnameOverride when provided. Otherwise use the chart's name
	as the stable, render-safe fullname. Avoid depending on .Release.Name here so
	rendering the umbrella chart (e.g., during CI validation) cannot produce
	invalid release-derived names. */ -}}
{{- if (default "" .Values.fullnameOverride) -}}
{{- (default "" .Values.fullnameOverride) | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- include "umbrella.name" . -}}
{{- end -}}
{{- end -}}