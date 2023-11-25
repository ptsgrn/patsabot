<script lang="ts">
  const BASE = 'https://patsabot.toolforge.org/';
  const lang =
    new URL(window.location.href).searchParams.get('lang') ||
    navigator.language;
  import {
    Content,
    DataTable,
    Toolbar,
    ToolbarContent,
    ToolbarMenu,
    ToolbarMenuItem,
    Button,
    DataTableSkeleton,
    InlineNotification,
    Tag,
    OverflowMenu,
    OverflowMenuItem,
    UnorderedList,
    ListItem,
    CodeSnippet,
    ButtonSet,
    PasswordInput,
    Modal,
  } from 'carbon-components-svelte';
  import User from 'carbon-icons-svelte/lib/User.svelte';
  import CollapseCategories from 'carbon-icons-svelte/lib/CollapseCategories.svelte';
  import Document from 'carbon-icons-svelte/lib/Document.svelte';
  import cronsture from 'cronstrue';
  import type { JobSerialized } from '../../src/patsabot/jobsmanager';
  import { onMount } from 'svelte';

  onMount(() => {
    APIKey = localStorage.getItem('APIKey') || '';
  });

  const fetchData = (
    input: URL | RequestInfo,
    method: 'get' | 'post' = 'get',
    init?: RequestInit,
  ) => {
    const url = typeof input === 'string' ? new URL(input, BASE) : input;
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');
    if (APIKey) headers.set('x-api-key', APIKey);
    init = { ...init, headers, method };
    return fetch(url, init);
  };
  const getJobsStatus = async () => {
    const res = await fetchData('/api/job');
    const data = await res.json();
    return data as JobSerialized[];
  };
  const testAPIKey = async () => {
    const res = await fetchData('/api/testapikey', 'post');
    if (res.ok) {
      alert('API Key is valid!');
      localStorage.setItem('APIKey', APIKey);
    } else {
      alert('API Key is invalid!');
      APIKey = '';
    }
  };
  const startJob = async (jobName: string) => {
    const answer = await openConfirmModal({
      heading: 'Confirm START',
      body: `Are you sure to <em>START</em> ${jobName}?`,
    });
    if (!answer) return;
    const res = await fetchData(`/api/job/${jobName}/start`, 'post');
    if (res.ok) {
      alert('Job started!');
    } else {
      alert('Job cannot start!');
    }
    refreshJobs();
  };
  const stopJob = async (jobName: string) => {
    const answer = await openConfirmModal({
      heading: 'Confirm STOP',
      body: `Are you sure to <em>STOP</em> ${jobName}?`,
    });
    if (!answer) return;
    const res = await fetchData(`/api/job/${jobName}/stop`, 'post');
    if (res.ok) {
      alert('Job stopped!');
    } else {
      alert('Job cannot stop!');
    }
    refreshJobs();
  };
  let jobStatus = getJobsStatus();
  const refreshJobs = async () => {
    jobStatus = getJobsStatus();
  };
  const formatDateIntl = Intl.DateTimeFormat(lang, {
    dateStyle: 'full',
    timeStyle: 'long',
  });

  let APIKey = '';
  let confirmModal = {
    open: false,
    size: 'sm',
    heading: 'Confirm',
    body: 'Are you sure?',
    primaryButtonText: 'Confirm',
    secondaryButtonText: 'Cancel',
    isDanger: false,
    onSubmit() {},
    onCancel() {},
  };
  const openConfirmModal = ({
    heading,
    body,
    onSubmit,
    isDanger = false,
  }: {
    heading: string;
    body: string;
    onSubmit?: () => void;
    isDanger?: boolean;
  }) => {
    let answer = false;
    return new Promise((resolve) => {
      confirmModal = {
        ...confirmModal,
        open: true,
        heading,
        body,
        primaryButtonText: 'Confirm',
        secondaryButtonText: 'Cancel',
        isDanger,
        onSubmit: () => {
          answer = true;
          confirmModal.open = false;
          resolve(answer);
        },
        onCancel: () => {
          answer = false;
          confirmModal.open = false;
          resolve(answer);
        },
      };
    });
  };
</script>

<Modal
  alert
  danger={confirmModal.isDanger}
  bind:open={confirmModal.open}
  modalHeading={confirmModal.heading}
  primaryButtonText={confirmModal.primaryButtonText}
  secondaryButtonText={confirmModal.secondaryButtonText}
  on:submit={confirmModal.onSubmit}
  on:close={confirmModal.onCancel}
>
  {@html confirmModal.body}
</Modal>

<Content about="Patsagorn's Bot" class="p-5 container m-auto">
  <h1 class="m-3">
    <a href="https://meta.wikimedia.org/wiki/User:Patsagorn_Y." target="_blank"
      >Patsagorn</a
    >'s bot
  </h1>
  <ButtonSet>
    <Button
      size="small"
      kind="secondary"
      icon={Document}
      href="https://meta.wikimedia.org/wiki/User:PatsaBot"
      >Bot's Userpage</Button
    >
    <Button
      kind="ghost"
      size="small"
      icon={CollapseCategories}
      href="https://th.wikipedia.org/wiki/%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B9%83%E0%B8%8A%E0%B9%89:PatsaBot"
      >Bot's Contributions (Thai Wikipedia)</Button
    >
    <Button
      size="small"
      icon={User}
      href="https://meta.wikimedia.org/wiki/User:Patsagorn_Y."
      >Contact Me</Button
    >
  </ButtonSet>
  <div class="my-6">
    {#await jobStatus}
      <DataTableSkeleton
        headers={['Name', 'Status', 'Last run', 'Next run', 'Actions']}
        rows={7}
      />
    {:then jobsStatus}
      <DataTable
        class="[&>.bx--data-table]:overflow-x-auto"
        title="Jobs status"
        description="List of jobs for PatsaBot"
        batchExpansion
        headers={[
          { key: 'name', value: 'Name' },
          { key: 'running', value: 'Status' },
          { key: 'action', empty: true },
        ]}
        rows={jobsStatus.map((jobdata, idx) => {
          return {
            id: idx,
            name: jobdata.name,
            running: jobdata.running,
            cron: jobdata.cron,
            next: jobdata.next,
            nexts: jobdata.nexts,
            last: jobdata.last,
            data: jobdata.data,
          };
        })}
      >
        <svelte:fragment slot="cell" let:row let:cell>
          {#if cell.key === 'running'}
            <Tag
              class="{cell.value
                ? '!bg-green-200'
                : '!bg-stone-300'} whitespace-nowrap"
            >
              {cell.value ? 'Running' : 'Stopped'}
            </Tag>
          {:else if cell.key === 'cron'}
            <code class="whitespace-nowrap">{cell.value}</code>
          {:else if cell.key === 'action'}
            {#if APIKey}
              <OverflowMenu>
                {#if row.running}
                  <OverflowMenuItem
                    danger
                    text="Stop"
                    on:click={() => stopJob(row.name)}
                  />
                {:else}
                  <OverflowMenuItem
                    text="Start"
                    on:click={() => startJob(row.name)}
                  />
                {/if}
              </OverflowMenu>
            {/if}
          {:else}
            {cell.value}
          {/if}
        </svelte:fragment>
        <svelte:fragment slot="expanded-row" let:row>
          <div class="space-y-2">
            <h4>Name</h4>
            <CodeSnippet code={row.name} />
            <h4>Crontab schedule</h4>
            <CodeSnippet code={row.cron} />
            <span class="leading-loose"
              >This Meaning: {cronsture.toString(row.cron)}</span
            >
            <h4>Commands</h4>
            <CodeSnippet code={row.data.command} />
            <h4>Last run</h4>
            <span
              >{row.last
                ? formatDateIntl.format(new Date(row.last))
                : 'N/A'}</span
            >
            <h4>Next runs</h4>
            <UnorderedList>
              {#each row.nexts as nextTime}
                <ListItem>{formatDateIntl.format(new Date(nextTime))}</ListItem>
              {/each}
            </UnorderedList>
          </div>
        </svelte:fragment>
        {#if APIKey}
          <Toolbar size="sm">
            <ToolbarContent>
              <ToolbarMenu>
                <ToolbarMenuItem primaryFocus>Restart all</ToolbarMenuItem>
                <ToolbarMenuItem hasDivider danger>Stop all</ToolbarMenuItem>
              </ToolbarMenu>
              <Button>Start New Jobs</Button>
            </ToolbarContent>
          </Toolbar>
        {/if}
      </DataTable>
    {:catch error}
      <InlineNotification
        hideCloseButton
        title="Error:"
        subtitle="Cannot access jobs data from PatsaBot' server."
      />
    {/await}
  </div>
  <div>
    <PasswordInput
      inline
      size="sm"
      labelText="API Key"
      bind:value={APIKey}
      placeholder="Enter PatsaBot API key here..."
    />
    <Button size="small" on:click={testAPIKey}>Test API Key</Button>
  </div>
</Content>
