/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getAttributes } from '../api/attributes'
import { getCampaigns } from '../api/campaigns'
import { createQuest, getQuest, updateQuest } from '../api/quests'
import type { Attribute, QuestPayload, QuestType, Recurrence } from '../api/types'
import { Panel } from '../components/Panel'

const questTypes: QuestType[] = ['daily', 'weekly', 'campaign', 'trial', 'reflection', 'recovery']
const recurrences: Recurrence[] = ['none', 'daily', 'weekly']
const rewardDefaults: Record<QuestType, { xp: number; gold: number; points: number }> = {
  daily: { xp: 50, gold: 10, points: 3 },
  weekly: { xp: 200, gold: 50, points: 10 },
  campaign: { xp: 150, gold: 30, points: 8 },
  trial: { xp: 500, gold: 100, points: 20 },
  reflection: { xp: 25, gold: 5, points: 2 },
  recovery: { xp: 20, gold: 5, points: 1 },
}

type RewardDraft = Record<string, { selected: boolean; points: number }>

function rewardsFromQuest(raw: string, attributes: Attribute[], questType: QuestType): RewardDraft {
  const defaults = Object.fromEntries(
    attributes.map((attribute) => [
      attribute.key,
      { selected: false, points: rewardDefaults[questType].points },
    ]),
  )
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item?.key && defaults[item.key]) {
          defaults[item.key] = { selected: true, points: Number(item.points) || rewardDefaults[questType].points }
        }
      }
    }
  } catch {
    return defaults
  }
  return defaults
}

export function QuestFormPage() {
  const { id } = useParams()
  const questId = id ? Number(id) : null
  const isEdit = questId !== null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const prefilledCampaignId = searchParams.get('campaign_id')

  const campaignsQuery = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns })
  const attributesQuery = useQuery({ queryKey: ['attributes'], queryFn: getAttributes })
  const questQuery = useQuery({
    queryKey: ['quests', questId],
    queryFn: () => getQuest(questId as number),
    enabled: isEdit,
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questType, setQuestType] = useState<QuestType>('daily')
  const [campaignId, setCampaignId] = useState('')
  const [xpReward, setXpReward] = useState(rewardDefaults.daily.xp)
  const [goldReward, setGoldReward] = useState(rewardDefaults.daily.gold)
  const [recurrence, setRecurrence] = useState<Recurrence>('daily')
  const [dueDate, setDueDate] = useState('')
  const [attributeRewards, setAttributeRewards] = useState<RewardDraft>({})

  useEffect(() => {
    if (!isEdit) {
      setXpReward(rewardDefaults[questType].xp)
      setGoldReward(rewardDefaults[questType].gold)
      if (questType === 'daily') setRecurrence('daily')
      if (questType === 'weekly') setRecurrence('weekly')
    }
  }, [isEdit, questType])

  useEffect(() => {
    if (!isEdit && prefilledCampaignId) {
      setCampaignId(prefilledCampaignId)
    }
  }, [isEdit, prefilledCampaignId])

  useEffect(() => {
    if (attributesQuery.data && Object.keys(attributeRewards).length === 0) {
      setAttributeRewards(rewardsFromQuest('[]', attributesQuery.data, questType))
    }
  }, [attributeRewards, attributesQuery.data, questType])

  useEffect(() => {
    if (questQuery.data && attributesQuery.data) {
      const quest = questQuery.data
      setTitle(quest.title)
      setDescription(quest.description ?? '')
      setQuestType(quest.quest_type)
      setCampaignId(quest.campaign_id ? String(quest.campaign_id) : '')
      setXpReward(quest.xp_reward)
      setGoldReward(quest.gold_reward)
      setRecurrence(quest.recurrence)
      setDueDate(quest.due_date ?? '')
      setAttributeRewards(rewardsFromQuest(quest.attribute_rewards, attributesQuery.data, quest.quest_type))
    }
  }, [attributesQuery.data, questQuery.data])

  const selectedRewards = useMemo(
    () =>
      Object.entries(attributeRewards)
        .filter(([, reward]) => reward.selected)
        .map(([key, reward]) => ({ key, points: Number(reward.points) || 0 })),
    [attributeRewards],
  )

  const saveMutation = useMutation({
    mutationFn: (payload: QuestPayload) =>
      isEdit ? updateQuest(questId as number, payload) : createQuest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/quests')
    },
  })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const payload: QuestPayload = {
      title,
      description: description.trim() || null,
      quest_type: questType,
      campaign_id: campaignId ? Number(campaignId) : null,
      xp_reward: Number(xpReward),
      gold_reward: Number(goldReward),
      attribute_rewards: JSON.stringify(selectedRewards),
      recurrence,
      due_date: recurrence === 'none' && dueDate ? dueDate : null,
    }
    saveMutation.mutate(payload)
  }

  return (
    <Panel title={isEdit ? 'Edit Quest' : 'New Quest'}>
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2">
          <span className="font-mono text-sm text-text-muted">Title</span>
          <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-primary" required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>

        <label className="grid gap-2">
          <span className="font-mono text-sm text-text-muted">Description</span>
          <textarea className="min-h-28 rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary outline-none focus:border-primary" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">Quest Type</span>
            <select className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={questType} onChange={(event) => setQuestType(event.target.value as QuestType)}>
              {questTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">Campaign</span>
            <select className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={campaignId} onChange={(event) => setCampaignId(event.target.value)}>
              <option value="">None</option>
              {(campaignsQuery.data ?? []).map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">Recurrence</span>
            <select className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-text-primary" value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)}>
              {recurrences.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">XP Reward</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-text-primary" min={0} type="number" value={xpReward} onChange={(event) => setXpReward(Number(event.target.value))} />
          </label>
          <label className="grid gap-2">
            <span className="font-mono text-sm text-text-muted">Gold Reward</span>
            <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-text-primary" min={0} type="number" value={goldReward} onChange={(event) => setGoldReward(Number(event.target.value))} />
          </label>
          {recurrence === 'none' ? (
            <label className="grid gap-2">
              <span className="font-mono text-sm text-text-muted">Due Date</span>
              <input className="rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-text-primary" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          ) : null}
        </div>

        <div>
          <p className="mb-3 font-mono text-sm text-text-muted">Attribute Rewards</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(attributesQuery.data ?? []).map((attribute) => {
              const reward = attributeRewards[attribute.key] ?? { selected: false, points: rewardDefaults[questType].points }
              return (
                <label key={attribute.key} className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-elevated p-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      checked={reward.selected}
                      type="checkbox"
                      onChange={(event) =>
                        setAttributeRewards((current) => ({
                          ...current,
                          [attribute.key]: { ...reward, selected: event.target.checked },
                        }))
                      }
                    />
                    <span className="truncate text-sm">{attribute.name}</span>
                  </span>
                  <input
                    className="w-20 rounded border border-border bg-bg-surface px-2 py-1 font-mono text-sm text-text-primary"
                    min={0}
                    type="number"
                    value={reward.points}
                    onChange={(event) =>
                      setAttributeRewards((current) => ({
                        ...current,
                        [attribute.key]: { ...reward, points: Number(event.target.value) },
                      }))
                    }
                  />
                </label>
              )
            })}
          </div>
        </div>

        {saveMutation.isError ? <p className="text-danger">Quest could not be saved.</p> : null}
        <div className="flex justify-end gap-3">
          <button className="rounded-md border border-border px-4 py-2 font-mono text-sm text-text-primary" type="button" onClick={() => navigate('/quests')}>
            Cancel
          </button>
          <button className="rounded-md bg-primary px-4 py-2 font-mono text-sm font-semibold text-white hover:bg-violet-600 disabled:bg-bg-elevated disabled:text-text-dim" disabled={saveMutation.isPending} type="submit">
            {saveMutation.isPending ? 'Saving' : 'Save Quest'}
          </button>
        </div>
      </form>
    </Panel>
  )
}
