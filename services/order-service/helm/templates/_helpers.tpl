{{- define "order-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "order-service.fullname" -}}
{{- if (default "" .Values.fullnameOverride) -}}
{{- (default "" .Values.fullnameOverride) | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := include "order-service.name" . -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}
