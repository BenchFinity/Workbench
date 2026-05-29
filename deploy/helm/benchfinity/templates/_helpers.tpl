{{/*
Expand the name of the chart.
*/}}
{{- define "benchfinity.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "benchfinity.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name and version, used as a label.
*/}}
{{- define "benchfinity.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels.
*/}}
{{- define "benchfinity.labels" -}}
helm.sh/chart: {{ include "benchfinity.chart" . }}
{{ include "benchfinity.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels.
*/}}
{{- define "benchfinity.selectorLabels" -}}
app.kubernetes.io/name: {{ include "benchfinity.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component-scoped selector labels. Pass a dict with "context" and "component".
*/}}
{{- define "benchfinity.componentSelectorLabels" -}}
{{ include "benchfinity.selectorLabels" .context }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Component-scoped common labels. Pass a dict with "context" and "component".
*/}}
{{- define "benchfinity.componentLabels" -}}
{{ include "benchfinity.labels" .context }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Per-component resource name, e.g. release-benchfinity-frontend.
Pass a dict with "context" and "component".
*/}}
{{- define "benchfinity.componentName" -}}
{{- printf "%s-%s" (include "benchfinity.fullname" .context) .component | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Service account name.
*/}}
{{- define "benchfinity.serviceAccountName" -}}
{{- default (include "benchfinity.fullname" .) .Values.serviceAccountName }}
{{- end }}
